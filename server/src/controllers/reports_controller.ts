import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

// ============================================================
// GET /api/reports/monthly — REPORTE MENSUAL
// ============================================================
export const getMonthlyReport = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') { res.status(403).json({ error: 'Sin permisos' }); return; }

    const { year, month } = req.query;
    const now = new Date();
    const y = Number(year)  || now.getFullYear();
    const m = Number(month) || now.getMonth() + 1;

    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth   = new Date(y, m, 0, 23, 59, 59);

    const reservations = await prisma.reservation.findMany({
      where: { start_time: { gte: startOfMonth, lte: endOfMonth } },
      include: { user: { select: { name: true, email: true } }, payment: true },
      orderBy: { start_time: 'asc' },
    });

    const paid       = reservations.filter(r => r.status === 'PAID' || r.status === 'COMPLETED');
    const cancelled  = reservations.filter(r => r.status === 'CANCELLED');

    const totalRevenue   = paid.reduce((acc, r) => acc + Number(r.total_paid), 0);
    const totalHours     = paid.reduce((acc, r) => acc + Number(r.hours_booked), 0);
    const avgPerReserv   = paid.length > 0 ? totalRevenue / paid.length : 0;
    const ivaAmount      = totalRevenue - totalRevenue / 1.16;
    const subtotal       = totalRevenue / 1.16;

    // Días del mes con más ocupación
    const byDay: Record<string, { count: number; revenue: number }> = {};
    paid.forEach(r => {
      const day = r.start_time.toISOString().split('T')[0] as string;
      if (!byDay[day]) byDay[day] = { count: 0, revenue: 0 };
      (byDay[day] as { count: number; revenue: number }).count++;
      (byDay[day] as { count: number; revenue: number }).revenue += Number(r.total_paid);
    });

    // Top 5 días
    const topDays = Object.entries(byDay)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([date, data]) => ({ date, ...data }));

    // Ocupación por hora
    const byHour: Record<number, number> = {};
    paid.forEach(r => {
      const hour = r.start_time.getHours();
      byHour[hour] = (byHour[hour] || 0) + 1;
    });

    // Capacity: sala abierta 13h/día × días del mes
    const daysInMonth = new Date(y, m, 0).getDate();
    const maxHours = daysInMonth * 13;
    const occupancyRate = maxHours > 0 ? Math.round((totalHours / maxHours) * 100) : 0;

    res.json({
      period: { year: y, month: m, startOfMonth, endOfMonth },
      summary: {
        totalReservations: reservations.length,
        paidReservations: paid.length,
        cancelledReservations: cancelled.length,
        cancellationRate: reservations.length > 0
          ? ((cancelled.length / reservations.length) * 100).toFixed(1)
          : '0',
        totalRevenue: totalRevenue.toFixed(2),
        subtotal: subtotal.toFixed(2),
        ivaAmount: ivaAmount.toFixed(2),
        totalHours: totalHours.toFixed(1),
        averagePerReservation: avgPerReserv.toFixed(2),
        occupancyRate,
      },
      topDays,
      byHour: Object.entries(byHour)
        .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
        .sort((a, b) => Number(a.hour) - Number(b.hour)),
      reservations: paid.map(r => ({
        id: r.id,
        date: r.start_time.toLocaleDateString('es-MX'),
        startTime: r.start_time.toTimeString().slice(0, 5),
        endTime:   r.end_time.toTimeString().slice(0, 5),
        hours: Number(r.hours_booked),
        userName: r.user.name,
        userEmail: r.user.email,
        totalPaid: Number(r.total_paid),
        status: r.status,
      })),
    });
  } catch (error) {
    console.error('Error en reporte mensual:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
};

// ============================================================
// GET /api/reports/overview — RESUMEN GENERAL (para AdminFinancial)
// ============================================================
export const getFinancialOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') { res.status(403).json({ error: 'Sin permisos' }); return; }

    // Últimos 12 meses
    const months: any[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const reservations = await prisma.reservation.findMany({
        where: { start_time: { gte: start, lte: end }, status: { notIn: ['CANCELLED', 'EXPIRED'] } },
      });

      const revenue = reservations.reduce((acc, r) => acc + Number(r.total_paid), 0);
      const hours   = reservations.reduce((acc, r) => acc + Number(r.hours_booked), 0);

      months.push({
        month: start.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
        revenue,
        reservations: reservations.length,
        hours,
      });
    }

    // Config actual
    const config  = await prisma.businessConfig.findUnique({ where: { id: 1 } });
    const packages = await prisma.pricingPackage.findMany({ where: { isActive: true } });

    res.json({ months, config, packages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener visión financiera' });
  }
};