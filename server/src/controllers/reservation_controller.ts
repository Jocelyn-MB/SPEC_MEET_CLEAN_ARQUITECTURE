import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { createPaymentIntent } from '../services/stripe.service';

// ============================================================
// VALIDACIONES ZOD
// ============================================================
const createReservationSchema = z.object({
  roomId: z.string().uuid('roomId inválido'),
  start_time: z.string().datetime('Fecha de inicio inválida'),
  end_time: z.string().datetime('Fecha de fin inválida'),
  package_id: z.number().int().positive().optional(),
  terms_accepted: z.boolean().refine(v => v === true, 'Debes aceptar los T&C'),
  accepted_terms_version: z.string().optional(),
});

const cancelReservationSchema = z.object({
  reason: z.string().optional(),
});

// ============================================================
// UTILIDADES
// ============================================================
const IVA_RATE = 0.16;

function calcTotal(hours: number, pricePerHour: number): number {
  return hours * pricePerHour;
}

function formatHour(date: Date): string {
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// ============================================================
// POST /api/reservations — CREAR RESERVA + PAYMENT INTENT
// ============================================================
export const createReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ error: 'No autenticado' }); return; }

    const validation = createReservationSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Datos inválidos', details: validation.error.format() });
      return;
    }

    const { roomId, start_time, end_time, package_id, terms_accepted, accepted_terms_version } = validation.data;
    const startTime = new Date(start_time);
    const endTime   = new Date(end_time);

    // ---- Validaciones de tiempo ----
    if (startTime >= endTime) {
      res.status(400).json({ error: 'La hora de inicio debe ser anterior a la hora de fin' });
      return;
    }
    if (startTime < new Date()) {
      res.status(400).json({ error: 'No puedes reservar en el pasado' });
      return;
    }

    const hours = (endTime.getTime() - startTime.getTime()) / 3600000;
    if (hours < 1) { res.status(400).json({ error: 'Mínimo 1 hora de reserva' }); return; }
    if (hours > 8) { res.status(400).json({ error: 'Máximo 8 horas de reserva' }); return; }

    // ---- Verificar sala ----
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.status !== 'ACTIVE') {
      res.status(404).json({ error: 'Sala no disponible' });
      return;
    }

    // ---- Config de negocio ----
    const config = await prisma.businessConfig.findUnique({ where: { id: 1 } });
    const cleaningMinutes = config?.cleaningMinutes ?? 30;

    // Tiempo de fin incluyendo limpieza
    const cleaningEndTime = new Date(endTime.getTime() + cleaningMinutes * 60000);

    // ---- Verificar disponibilidad (incluye bloqueos de limpieza) ----
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        roomId,
        status: { notIn: ['CANCELLED', 'EXPIRED'] },
        OR: [
          { start_time: { lt: cleaningEndTime }, end_time: { gt: startTime } },
          // También verificar el cleaning_end_time de reservas previas
          { cleaning_end_time: { gt: startTime }, start_time: { lt: startTime } },
        ],
      },
    });

    if (conflictingReservation) {
      res.status(409).json({ error: 'Ese horario ya está reservado (incluye tiempo de limpieza)' });
      return;
    }

    // ---- Verificar bloqueos del admin ----
    const blockedSlot = await prisma.blockedSlot.findFirst({
      where: {
        roomId,
        OR: [
          { start_time: { lt: endTime }, end_time: { gt: startTime } },
        ],
      },
    });

    if (blockedSlot) {
      res.status(409).json({ error: `Ese horario está bloqueado: ${blockedSlot.reason}` });
      return;
    }

    // ---- Calcular precio ----
    let totalAmount: number;
    let appliedPackageId: number | null = null;

    if (package_id) {
      const pkg = await prisma.pricingPackage.findUnique({ where: { id: package_id, isActive: true } });
      if (pkg) {
        totalAmount = Number(pkg.price);
        appliedPackageId = package_id;
      } else {
        totalAmount = calcTotal(hours, Number(room.price_per_hour));
      }
    } else {
      totalAmount = calcTotal(hours, Number(room.price_per_hour));
    }

    // ---- Obtener usuario para email ----
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }

    // ---- Obtener versión activa de T&C ----
    const activeTerm = await prisma.termsConfig.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });

    // ---- Crear reserva en estado PENDING ----
    const newReservation = await prisma.reservation.create({
      data: {
        userId,
        roomId,
        start_time: startTime,
        end_time: endTime,
        cleaning_end_time: cleaningEndTime,
        hours_booked: hours,
        total_paid: totalAmount,
        package_id: appliedPackageId,
        terms_accepted,
        accepted_terms_version: accepted_terms_version ?? activeTerm?.version ?? '1.0.0',
        status: 'PENDING',
      },
    });

    // ---- Crear PaymentIntent en Stripe ----
    const paymentIntent = await createPaymentIntent(totalAmount, newReservation.id, user.email);

    res.status(201).json({
      message: 'Reserva creada, procede al pago',
      reservationId: newReservation.id,
      clientSecret: paymentIntent.client_secret,
      totalAmount,
      hours,
    });
  } catch (error) {
    console.error('Error al crear reserva:', error);
    res.status(500).json({ error: 'Error interno al procesar la reserva' });
  }
};

// ============================================================
// GET /api/reservations/availability — DISPONIBILIDAD POR DÍA
// ============================================================
export const getAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId, date } = req.query;
    if (!roomId || !date) {
      res.status(400).json({ error: 'Faltan parámetros roomId o date' });
      return;
    }

    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay   = new Date(`${date}T23:59:59`);

    // Reservas del día
    const reservations = await prisma.reservation.findMany({
      where: {
        roomId: String(roomId),
        status: { notIn: ['CANCELLED', 'EXPIRED'] },
        OR: [
          { start_time: { gte: startOfDay, lte: endOfDay } },
          { cleaning_end_time: { gte: startOfDay, lte: endOfDay } },
        ],
      },
      select: { start_time: true, end_time: true, cleaning_end_time: true, status: true },
    });

    // Bloqueos del admin
    const blocks = await prisma.blockedSlot.findMany({
      where: {
        roomId: String(roomId),
        OR: [
          { start_time: { gte: startOfDay, lte: endOfDay } },
          { end_time: { gte: startOfDay, lte: endOfDay } },
        ],
      },
      select: { start_time: true, end_time: true, reason: true },
    });

    res.json({ reservations, blocks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener disponibilidad' });
  }
};

// ============================================================
// GET /api/reservations/my — MIS RESERVAS
// ============================================================
export const getMyReservations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ error: 'No autenticado' }); return; }

    const now = new Date();

    const [upcoming, past] = await Promise.all([
      prisma.reservation.findMany({
        where: { userId, status: { notIn: ['CANCELLED'] }, start_time: { gte: now } },
        include: { room: true, payment: true },
        orderBy: { start_time: 'asc' },
      }),
      prisma.reservation.findMany({
        where: {
          userId,
          OR: [{ start_time: { lt: now } }, { status: 'CANCELLED' }],
        },
        include: { room: true, payment: true },
        orderBy: { start_time: 'desc' },
        take: 20,
      }),
    ]);

    const formatReservation = (r: any) => ({
      id: r.id,
      date: r.start_time.toISOString().split('T')[0],
      startTime: formatHour(r.start_time),
      endTime: formatHour(r.end_time),
      hours: Number(r.hours_booked),
      totalPaid: Number(r.total_paid),
      accessCode: r.access_code,
      status: r.status,
      roomName: r.room?.name,
      paymentStatus: r.payment?.status,
      canCancel: r.start_time > new Date(Date.now() + 12 * 3600000) && r.status === 'PAID',
    });

    // Stats del usuario
    const totalHours = upcoming.reduce((acc, r) => acc + Number(r.hours_booked), 0) +
                       past.filter(r => r.status !== 'CANCELLED').reduce((acc, r) => acc + Number(r.hours_booked), 0);

    const activeReservations = upcoming.filter(r => r.status === 'PAID').length;
    const nextReservation = upcoming.find(r => r.status === 'PAID');

    res.json({
      stats: {
        activeReservations,
        totalHours,
        nextReservationDate: nextReservation
          ? nextReservation.start_time.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
          : '--',
      },
      upcoming: upcoming.map(formatReservation),
      past: past.map(formatReservation),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
};

// ============================================================
// GET /api/reservations/my-dates — FECHAS RESERVADAS (para calendario)
// ============================================================
export const getMyReservationDates = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ error: 'No autenticado' }); return; }

    const reservations = await prisma.reservation.findMany({
      where: { userId, status: { notIn: ['CANCELLED', 'EXPIRED'] }, start_time: { gte: new Date() } },
      select: { start_time: true },
    });

    const dates = [...new Set(reservations.map(r => r.start_time.toISOString().split('T')[0]))];
    res.json(dates);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener fechas' });
  }
};

// ============================================================
// DELETE /api/reservations/:id — CANCELAR RESERVA
// ============================================================
export const cancelReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { reason } = req.body;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { payment: true, user: true },
    });

    if (!reservation) { res.status(404).json({ error: 'Reserva no encontrada' }); return; }
    if (reservation.userId !== userId && req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Sin permisos para cancelar esta reserva' }); return;
    }
    if (reservation.status === 'CANCELLED') {
      res.status(400).json({ error: 'La reserva ya está cancelada' }); return;
    }

    const config = await prisma.businessConfig.findUnique({ where: { id: 1 } });
    const hoursUntilStart = (reservation.start_time.getTime() - Date.now()) / 3600000;

    let refundAmount = 0;
    const fullRefundHours  = config?.refundFullHours    ?? 24;
    const partialHours     = config?.refundPartialHours ?? 12;
    const partialPct       = config?.refundPartialPct   ?? 50;

    if (hoursUntilStart >= fullRefundHours) {
      refundAmount = Number(reservation.total_paid);
    } else if (hoursUntilStart >= partialHours) {
      refundAmount = Number(reservation.total_paid) * (partialPct / 100);
    }

    // Actualizar estado
    await prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED', admin_notes: reason },
    });

    // TODO: Procesar reembolso en Stripe si refundAmount > 0

    // Enviar email de cancelación
    const { sendCancellationEmail } = await import('../services/email.service');
    await sendCancellationEmail(
      reservation.user.email,
      reservation.user.name,
      reservation.start_time.toLocaleDateString('es-MX'),
      formatHour(reservation.start_time),
      refundAmount
    ).catch(err => console.error('Error enviando email cancelación:', err));

    res.json({ message: 'Reserva cancelada', refundAmount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cancelar reserva' });
  }
};

// ============================================================
// GET /api/reservations/all — TODAS LAS RESERVAS (Admin)
// ============================================================
export const getAllReservations = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') { res.status(403).json({ error: 'Sin permisos' }); return; }

    const { status, date, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (date) {
      const d = new Date(String(date));
      where.start_time = { gte: new Date(d.setHours(0,0,0,0)), lte: new Date(d.setHours(23,59,59,999)) };
    }

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where, skip, take: Number(limit),
        include: { user: { select: { name: true, email: true } }, room: true, payment: true },
        orderBy: { start_time: 'desc' },
      }),
      prisma.reservation.count({ where }),
    ]);

    res.json({ reservations, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
};