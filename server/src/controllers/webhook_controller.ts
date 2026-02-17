import { Request, Response } from 'express';
import { prisma } from "../config/prisma"; // Asegúrate de que apunte a tu instancia de Prisma
import { constructEvent } from '../services/stripe.service';
import { generatePasscode } from '../services/ttlock.service';
import { create } from 'domain';

export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
    // 1. OBTENER LA FIRMA DE SEGURIDAD
    // Stripe manda una firma en los headers para probar que el mensaje es real y no de un hacker.
    const sig = req.headers['stripe-signature'] as string;
    
    let event;

    try {
        // 2. VALIDAR LA FIRMA
        // Usamos la función que creamos en stripe.service.ts
        // req.body AQUÍ viene como Buffer (crudo) gracias a la configuración que hicimos en app.ts
        event = constructEvent(req.body, sig);
    } catch (err) {
        console.error("Error validando firma del Webhook:", err);
        res.status(400).send(`Webhook Error: ${err}`);
        return;
    }

    // 3. MANEJAR EL EVENTO
    // Stripe manda muchos tipos de eventos. Solo nos importa "payment_intent.succeeded".
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as any;
        
        // Extraemos el ID de la reserva que guardamos en la metadata cuando creamos el pago
        const reservationId = paymentIntent.metadata.reservationId;

        console.log(`Pago confirmado por Stripe. Procesando Reserva ID: ${reservationId}`);

        try {
            // A. Buscar la reserva y los datos de la sala (necesitamos el ID de la cerradura)
            const reservation = await prisma.reservation.findUnique({
                where: { id: reservationId },
                include: { room: true }
            });

            if (!reservation) {
                console.error("❌ Reserva no encontrada en base de datos.");
                res.status(404).json({ error: "Reserva no encontrada" });
                return;
            }

            // B. GENERAR CÓDIGO DE ACCESO (TTLock)
            let accessCode = null;

            if (reservation.room.ttlock_lock_id) {
                try {
                    // Llamamos al servicio (Si es MOCK, devolverá "123456")
                    accessCode = await generatePasscode(
                        reservation.room.ttlock_lock_id,
                        reservation.start_time,
                        reservation.end_time
                    );
                    console.log(`Código generado: ${accessCode}`);
                } catch (ttlockError) {
                    console.error("Error generando código TTLock (se guardará reserva pagada pero sin código):", ttlockError);
                    // No detenemos el flujo, queremos marcarla como pagada aunque falle el código
                }
            } else {
                console.warn("La sala no tiene cerradura vinculada (ttlock_lock_id es null).");
            }

            // C. ACTUALIZAR BASE DE DATOS (El Gran Final) 🏁
            // Cambiamos estado a PAID y guardamos el código
            await prisma.$transaction(async (tx) => {
                await tx.reservation.update({
                    where: {id: reservationId},
                    data: {
                        status: 'PAID',
                        access_code:accessCode
                    }
                });

                await tx.payment.create({
                    data: {
                        amount: paymentIntent.amount / 100,
                        status: 'COMPLETED',
                        provider_id: paymentIntent.id,
                        //provider: 'STRIPE',
                        iva_breakdown: "IVA 16& INCLUIDO",
                        reservationId: reservationId, 
                    }
                });
            });

            console.log(`Reserva ${reservationId} finalizada exitosamente.`);

        } catch (error) {
            console.error("Error interno procesando webhook:", error);
            // IMPORTANTE: Si devolvemos error 500, Stripe reintentará enviarlo.
            // Si es un error de lógica nuestra (bug), a veces es mejor devolver 200 para que pare.
            res.status(500).json({ error: "Error interno" });
            return;
        }
    }

    // 4. RESPONDER A STRIPE
    // Siempre debemos devolver 200 OK rápido para confirmar que recibimos el mensaje.
    res.json({ received: true });
};