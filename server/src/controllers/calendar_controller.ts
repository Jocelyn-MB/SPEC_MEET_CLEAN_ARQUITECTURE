import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';

// ============================================================
// VALIDACIONES
// ============================================================
const blockSlotSchema = z.object({
  roomId: z.string().uuid('roomId inválido'),
  start_time: z.string().datetime('Fecha de inicio inválida'),
  end_time: z.string().datetime('Fecha de fin inválida'),
  reason: z.string().min(1, 'El motivo es requerido').max(200),
});

// ============================================================
// GET /api/calendar/reservations — Reservas para el calendario
// ============================================================
export const getCalendarReservations = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') { res.status(403).json({ error: 'Sin permisos' }); return; }

    const { year, month } = req.query;

    let startOfMonth: Date;
    let endOfMonth: Date;

    if (year && month) {
      startOfMonth = new Date(Number(year), Number(month) - 1, 1);
      endOfMonth   = new Date(Number(year), Number(month), 0, 23, 59, 59);
    } else {
      const now = new Date();
      startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const [reservations, blockedSlots] = await Promise.all([
      prisma.reservation.findMany({
        where: {
          start_time: { gte: startOfMonth, lte: endOfMonth },
          status: { notIn: ['CANCELLED', 'EXPIRED'] },
        },
        include: { user: { select: { name: true, email: true } }, room: true },
        orderBy: { start_time: 'asc' },
      }),
      prisma.blockedSlot.findMany({
        where: {
          start_time: { gte: startOfMonth, lte: endOfMonth },
        },
        include: { room: true },
        orderBy: { start_time: 'asc' },
      }),
    ]);

    const formattedReservations = reservations.map(r => ({
      id: r.id,
      type: 'reservation' as const,
      date: new Date(r.start_time),
      startTime: r.start_time.toTimeString().slice(0, 5),
      endTime:   r.end_time.toTimeString().slice(0, 5),
      userName: r.user.name,
      userEmail: r.user.email,
      roomName: r.room.name,
      status: r.status,
      totalPaid: Number(r.total_paid),
      accessCode: r.access_code,
    }));

    const formattedBlocks = blockedSlots.map(b => ({
      id: b.id,
      type: 'block' as const,
      date: new Date(b.start_time),
      startTime: b.start_time.toTimeString().slice(0, 5),
      endTime:   b.end_time.toTimeString().slice(0, 5),
      reason: b.reason,
      roomName: b.room.name,
      roomId: b.roomId,
    }));

    res.json({ reservations: formattedReservations, blockedSlots: formattedBlocks });
  } catch (error) {
    console.error('Error en calendario:', error);
    res.status(500).json({ error: 'Error al obtener datos del calendario' });
  }
};

// ============================================================
// POST /api/calendar/block — BLOQUEAR HORARIO
// ============================================================
export const blockTimeSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') { res.status(403).json({ error: 'Sin permisos' }); return; }

    const validation = blockSlotSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Datos inválidos', details: validation.error.format() });
      return;
    }

    const { roomId, start_time, end_time, reason } = validation.data;
    const startTime = new Date(start_time);
    const endTime   = new Date(end_time);

    if (startTime >= endTime) {
      res.status(400).json({ error: 'La hora de inicio debe ser anterior a la de fin' }); return;
    }

    // Verificar conflicto con reservas existentes
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        roomId,
        status: { notIn: ['CANCELLED', 'EXPIRED'] },
        OR: [{ start_time: { lt: endTime }, end_time: { gt: startTime } }],
      },
    });

    if (conflictingReservation) {
      res.status(409).json({ error: 'Hay una reserva de cliente en ese horario. Cancélala primero.' });
      return;
    }

    const block = await prisma.blockedSlot.create({
      data: {
        roomId,
        start_time: startTime,
        end_time: endTime,
        reason,
        created_by: req.user?.userId,
      },
    });

    res.status(201).json({ message: 'Horario bloqueado correctamente', block });
  } catch (error) {
    console.error('Error al bloquear horario:', error);
    res.status(500).json({ error: 'Error al crear bloqueo' });
  }
};

// ============================================================
// DELETE /api/calendar/block/:id — ELIMINAR BLOQUEO
// ============================================================
export const deleteBlockSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') { res.status(403).json({ error: 'Sin permisos' }); return; }

    const { id } = req.params;
    await prisma.blockedSlot.delete({ where: { id } });
    res.json({ message: 'Bloqueo eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar bloqueo' });
  }
};