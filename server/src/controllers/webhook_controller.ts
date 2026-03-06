import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { constructEvent } from '../services/stripe.service';
import { generatePasscode } from '../services/ttlock.service';
import { sendConfirmationEmail } from '../services/email.service';

// ============================================================
// POST /api/webhooks/stripe
// Stripe llama a este endpoint cuando se completa un pago
// ============================================================
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;

  let event;
  try {
    event = constructEvent(req.body, sig);
  } catch (err) {
    console.error('❌ Error validando firma Stripe Webhook:', err);
    res.status(400).send(`Webhook Error: ${err}`);
    return;
  }

  // ============================================================
  // EVENTO: PAGO EXITOSO
  // ============================================================
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as any;
    const reservationId = paymentIntent.metadata?.reservationId;

    if (!reservationId) {
      console.error('❌ No hay reservationId en metadata del PaymentIntent');
      res.json({ received: true });
      return;
    }

    console.log(`💳 Pago confirmado por Stripe. Procesando Reserva ID: ${reservationId}`);

    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: { room: true, user: true },
      });

      if (!reservation) {
        console.error(`❌ Reserva ${reservationId} no encontrada`);
        res.json({ received: true });
        return;
      }

      if (reservation.status === 'PAID') {
        console.log(`⚠️ Reserva ${reservationId} ya fue procesada`);
        res.json({ received: true });
        return;
      }

      // ---- Generar código de acceso TTLock ----
      let accessCode: string | null = null;
      if (reservation.room.ttlock_lock_id) {
        try {
          accessCode = await generatePasscode(
            reservation.room.ttlock_lock_id,
            reservation.start_time,
            reservation.end_time
          );
          console.log(`🔐 Código de acceso generado: ${accessCode}`);
        } catch (ttlockError) {
          console.error('❌ Error generando código TTLock:', ttlockError);
          // Generamos código de respaldo para no bloquear la reserva
          accessCode = Math.floor(100000 + Math.random() * 900000).toString();
          console.log(`⚠️ Usando código de respaldo: ${accessCode}`);
        }
      } else {
        accessCode = Math.floor(100000 + Math.random() * 900000).toString();
      }

      // ---- Calcular IVA ----
      const totalAmount = paymentIntent.amount / 100; // Convertir de centavos
      const subtotal = totalAmount / 1.16;
      const ivaAmount = totalAmount - subtotal;

      // ---- Transacción atómica: actualizar reserva y crear pago ----
      await prisma.$transaction(async (tx) => {
        await tx.reservation.update({
          where: { id: reservationId },
          data: { status: 'PAID', access_code: accessCode },
        });

        await tx.payment.create({
          data: {
            reservationId,
            amount:        totalAmount,
            subtotal:      subtotal,
            iva_amount:    ivaAmount,
            currency:      'MXN',
            provider_id:   paymentIntent.id,
            status:        'COMPLETED',
            paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
            iva_breakdown: `IVA 16% — Subtotal: $${subtotal.toFixed(2)} | IVA: $${ivaAmount.toFixed(2)} | Total: $${totalAmount.toFixed(2)}`,
          },
        });
      });

      console.log(`✅ Reserva ${reservationId} actualizada a PAID con código ${accessCode}`);

      // ---- Obtener configuración para el email ----
      const config = await prisma.businessConfig.findUnique({ where: { id: 1 } });

      // ---- Enviar email de confirmación ----
      await sendConfirmationEmail({
        userName:         reservation.user.name,
        userEmail:        reservation.user.email,
        reservationDate:  reservation.start_time.toLocaleDateString('es-MX', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        }),
        startTime: reservation.start_time.toTimeString().slice(0, 5),
        endTime:   reservation.end_time.toTimeString().slice(0, 5),
        accessCode: accessCode!,
        totalPaid:  totalAmount,
        hours:      Number(reservation.hours_booked),
        roomName:   reservation.room.name,
        address:    config?.address || 'Consulta la app para la dirección',
      }).catch(err => console.error('❌ Error enviando email de confirmación:', err));

    } catch (error) {
      console.error('❌ Error interno procesando webhook:', error);
      // Respondemos 200 para que Stripe no reintente infinitamente
    }
  }

  // ============================================================
  // EVENTO: PAGO FALLIDO
  // ============================================================
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as any;
    const reservationId = paymentIntent.metadata?.reservationId;

    if (reservationId) {
      await prisma.reservation.update({
        where: { id: reservationId },
        data: { status: 'EXPIRED' },
      }).catch(err => console.error('Error marcando reserva como expirada:', err));
    }
  }

  res.json({ received: true });
};