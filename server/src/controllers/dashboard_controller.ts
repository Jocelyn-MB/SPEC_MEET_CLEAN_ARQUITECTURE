import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // --- RANGOS DE FECHAS ---
        const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
        const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0);
        
        const startOfPrevMonth = new Date(currentYear, currentMonth - 1, 1);
        const endOfPrevMonth = new Date(currentYear, currentMonth, 0);

        // --- CONSULTAS PARALELAS ---
        const [
            currentReservations,
            prevReservations,
            recentReservations,
            totalRooms
        ] = await Promise.all([
            // Mes Actual
            prisma.reservation.findMany({
                where: { start_time: { gte: startOfCurrentMonth, lte: endOfCurrentMonth }, status: { not: 'CANCELLED' } }
            }),
            // Mes Anterior
            prisma.reservation.findMany({
                where: { start_time: { gte: startOfPrevMonth, lte: endOfPrevMonth }, status: { not: 'CANCELLED' } }
            }),
            // Recientes (Últimas 4) con datos de usuario
            prisma.reservation.findMany({
                take: 4,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true } } }
            }),
            // Total de salas (para calcular capacidad)
            prisma.room.count({ where: { status: 'DISPONIBLE' } })
        ]);

        // --- 1. CÁLCULO DE INGRESOS ---
        const currentRevenue = currentReservations.reduce((acc, res) => acc + Number(res.total_paid), 0);
        const prevRevenue = prevReservations.reduce((acc, res) => acc + Number(res.total_paid), 0);
        const revenueChange = prevRevenue === 0 ? 100 : ((currentRevenue - prevRevenue) / prevRevenue) * 100;

        // --- 2. CÁLCULO DE RESERVAS ---
        const currentCount = currentReservations.length;
        const prevCount = prevReservations.length;
        const reservationsChange = prevCount === 0 ? 100 : ((currentCount - prevCount) / prevCount) * 100;

        // --- 3. CÁLCULO DE HORAS PROMEDIO ---
        const calculateAvgHours = (reservations: any[]) => {
            if (reservations.length === 0) return 0;
            const totalHours = reservations.reduce((acc, res) => {
                const diff = new Date(res.end_time).getTime() - new Date(res.start_time).getTime();
                return acc + (diff / (1000 * 60 * 60));
            }, 0);
            return totalHours / reservations.length;
        };
        const currentAvgHours = calculateAvgHours(currentReservations);
        const prevAvgHours = calculateAvgHours(prevReservations);
        const avgHoursChange = prevAvgHours === 0 ? 100 : ((currentAvgHours - prevAvgHours) / prevAvgHours) * 100;

        // --- 4. CÁLCULO DE OCUPACIÓN (Mes Actual) ---
        // Capacidad teórica: Días del mes * 12 horas operativas * Total Salas
        // Nota: Si quieres ser más preciso, podrías traer la configuración de horarios, pero 12h es un estándar bueno.
        const operationalHoursPerDay = 12; 
        const daysInMonth = endOfCurrentMonth.getDate();
        const totalCapacityHours = daysInMonth * operationalHoursPerDay * (totalRooms || 1);
        
        const bookedHoursCurrent = currentReservations.reduce((acc, res) => {
             const diff = new Date(res.end_time).getTime() - new Date(res.start_time).getTime();
             return acc + (diff / (1000 * 60 * 60));
        }, 0);
        
        const currentOccupancy = totalCapacityHours === 0 ? 0 : (bookedHoursCurrent / totalCapacityHours) * 100;

        // Ocupación Mes Anterior (para el % de cambio)
        const daysInPrevMonth = endOfPrevMonth.getDate();
        const totalCapacityPrev = daysInPrevMonth * operationalHoursPerDay * (totalRooms || 1);
        const bookedHoursPrev = prevReservations.reduce((acc, res) => {
            const diff = new Date(res.end_time).getTime() - new Date(res.start_time).getTime();
            return acc + (diff / (1000 * 60 * 60));
       }, 0);
       const prevOccupancy = totalCapacityPrev === 0 ? 0 : (bookedHoursPrev / totalCapacityPrev) * 100;
       const occupancyChange = prevOccupancy === 0 ? 100 : ((currentOccupancy - prevOccupancy) / prevOccupancy) * 100;


        // --- 5. OCUPACIÓN POR DÍA (Lunes a Viernes) ---
        // Analizamos todas las reservas del mes actual para sacar un promedio por día de la semana
        const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const occupancyByDayMap = new Array(7).fill(0);
        const dayCounts = new Array(7).fill(0); // Cuántos "Lunes", "Martes" hubo en el mes

        // Contar cuántos días de cada tipo hubo en el mes para sacar el promedio
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(currentYear, currentMonth, d);
            dayCounts[date.getDay()]++;
        }

        currentReservations.forEach(res => {
            const dayIndex = new Date(res.start_time).getDay();
            const hours = (new Date(res.end_time).getTime() - new Date(res.start_time).getTime()) / 3600000;
            occupancyByDayMap[dayIndex] += hours;
        });

        // Formatear para el frontend (Solo Lunes a Viernes como en tu diseño original)
        const occupancyByDay = [1, 2, 3, 4, 5].map(dayIndex => {
            const totalHoursBooked = occupancyByDayMap[dayIndex];
            const capacityForThatDay = dayCounts[dayIndex] * operationalHoursPerDay * (totalRooms || 1);
            const percentage = capacityForThatDay === 0 ? 0 : Math.round((totalHoursBooked / capacityForThatDay) * 100);
            
            return {
                day: daysOfWeek[dayIndex],
                percentage: percentage
            };
        });

        // --- 6. INGRESOS POR SEMANA (Últimas 7 semanas) ---
        // Generamos los datos para el gráfico de barras
        const revenueByWeek = [];
        for (let i = 6; i >= 0; i--) {
            const end = new Date();
            end.setDate(end.getDate() - (i * 7));
            const start = new Date(end);
            start.setDate(start.getDate() - 6);
            start.setHours(0,0,0,0);
            
            // Buscar reservas en esta semana específica
            const weeklyReservations = await prisma.reservation.findMany({
                where: {
                    start_time: { gte: start, lte: end },
                    status: { not: 'CANCELLED' }
                }
            });
            
            const weeklyTotal = weeklyReservations.reduce((acc, res) => acc + Number(res.total_paid), 0);
            revenueByWeek.push({
                week: `Sem ${7-i}`,
                amount: weeklyTotal,
                // Calculamos un porcentaje relativo al máximo para la altura de la barra (css height %)
                // Esto se ajustará en el frontend, aquí mandamos el valor absoluto
            });
        }
        
        // Normalizar porcentajes para el gráfico
        const maxWeeklyRevenue = Math.max(...revenueByWeek.map(w => w.amount)) || 1;
        const revenueChartData = revenueByWeek.map(w => ({
            ...w,
            heightPercent: Math.round((w.amount / maxWeeklyRevenue) * 100)
        }));

        res.json({
            stats: {
                revenue: { current: currentRevenue, percentChange: revenueChange.toFixed(1) },
                reservations: { current: currentCount, percentChange: reservationsChange.toFixed(1) },
                occupancy: { current: Math.round(currentOccupancy), percentChange: occupancyChange.toFixed(1) },
                averageHours: { current: currentAvgHours.toFixed(1), percentChange: avgHoursChange.toFixed(1) }
            },
            recentReservations: recentReservations.map(res => ({
                id: res.id,
                userName: (res as any).user?.name || 'Usuario',
                date: res.start_time,
                time: `${new Date(res.start_time).getHours()}:00 - ${new Date(res.end_time).getHours()}:00`,
                status: res.status,
                amount: Number(res.total_paid)
            })),
            occupancyByDay,
            revenueChartData
        });

    } catch (error) {
        console.error("Error en dashboard:", error);
        res.status(500).json({ error: "Error calculando métricas" });
    }
};