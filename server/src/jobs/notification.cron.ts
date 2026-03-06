import cron from 'node-cron';
import { prisma } from '../config/prisma';
import { sendReminderEmail } from '../services/email.service';

// ============================================================
// CRON: NOTIFICACIONES AUTOMÁTICAS
// Se ejecuta cada 5 minutos y revisa las reservas próximas
// ============================================================

export const startNotificationCron = () => {
  // Ejecutar cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();

      // Ventanas de tiempo para notificaciones
      const windows = [
        { label: 'REMINDER_24H', minutesBefore: 1440, rangeMin: 5 },  // 24h ± 5min
        { label: 'REMINDER_1H',  minutesBefore: 60,   rangeMin: 5 },  // 1h ± 5min
        { label: 'REMINDER_10MIN', minutesBefore: 10, rangeMin: 5 },  // 10min ± 5min
      ];

      for (const window of windows) {
        const targetTime = new Date(now.getTime() + window.minutesBefore * 60000);
        const rangeStart = new Date(targetTime.getTime() - window.rangeMin * 60000);
        const rangeEnd   = new Date(targetTime.getTime() + window.rangeMin * 60000);

        // Buscar reservas en ese rango que no hayan sido notificadas
        const reservations = await prisma.reservation.findMany({
          where: {
            status: 'PAID',
            start_time: { gte: rangeStart, lte: rangeEnd },
          },
          include: { user: true, room: true },
        });

        for (const reservation of reservations) {
          // Verificar si ya se envió esta notificación
          const existingNotification = await prisma.scheduledNotification.findFirst({
            where: {
              reservationId: reservation.id,
              type: window.label,
              status: 'SENT',
            },
          });

          if (existingNotification) continue;

          try {
            // Enviar email
            await sendReminderEmail(
              reservation.user.email,
              reservation.user.name,
              reservation.start_time.toLocaleDateString('es-MX', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              }),
              reservation.start_time.toTimeString().slice(0, 5),
              reservation.access_code || '------',
              window.minutesBefore
            );

            // Registrar notificación enviada
            await prisma.scheduledNotification.create({
              data: {
                reservationId: reservation.id,
                type: window.label,
                scheduledFor: targetTime,
                sentAt: now,
                status: 'SENT',
              },
            });

            console.log(`📧 Notificación ${window.label} enviada a ${reservation.user.email} para reserva ${reservation.id}`);
          } catch (emailError) {
            console.error(`❌ Error enviando notificación ${window.label}:`, emailError);

            // Registrar fallo
            await prisma.scheduledNotification.create({
              data: {
                reservationId: reservation.id,
                type: window.label,
                scheduledFor: targetTime,
                status: 'FAILED',
              },
            });
          }
        }
      }

      // ---- Marcar reservas EXPIRADAS ----
      // Reservas PENDING que llevan más de 30 minutos sin pagar
      await prisma.reservation.updateMany({
        where: {
          status: 'PENDING',
          createdAt: { lt: new Date(now.getTime() - 30 * 60000) },
        },
        data: { status: 'EXPIRED' },
      });

      // Marcar reservas PAID pasadas como COMPLETED
      await prisma.reservation.updateMany({
        where: {
          status: 'PAID',
          end_time: { lt: now },
        },
        data: { status: 'COMPLETED' },
      });

    } catch (error) {
      console.error('❌ Error en cron de notificaciones:', error);
    }
  });

  console.log('⏰ Cron de notificaciones iniciado (cada 5 minutos)');
};