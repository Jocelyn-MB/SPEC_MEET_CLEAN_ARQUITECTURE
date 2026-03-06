import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarIcon, DollarSignIcon, UsersIcon, ClockIcon,
  SettingsIcon, Loader2, RefreshCwIcon, AlertCircleIcon
} from 'lucide-react';
import api from '../../api/axios';

// ─── Tipos ───────────────────────────────────────────────────
interface StatCard {
  current: number | string;
  percentChange: string | number;
}

interface DashboardStats {
  revenue:      StatCard;
  reservations: StatCard;
  occupancy:    StatCard;
  averageHours: StatCard;
}

interface RecentReservation {
  id:       string;
  userName: string;
  date:     string;
  time:     string;
  status:   string;
  amount:   number;
}

interface OccupancyDay {
  day:        string;
  percentage: number;
}

interface RevenueWeek {
  week:          string;
  amount:        number;
  heightPercent: number;
}

interface DashboardData {
  stats:              DashboardStats;
  recentReservations: RecentReservation[];
  occupancyByDay:     OccupancyDay[];
  revenueChartData:   RevenueWeek[];
}

// ─── Helper: badge de estado ─────────────────────────────────
const getStatusBadge = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'confirmed' || s === 'paid')
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Confirmada</span>;
  if (s === 'pending')
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>;
  if (s === 'cancelled')
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Cancelada</span>;
  return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
};

// ─── Componente Principal ────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const [data, setData]               = useState<DashboardData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/dashboard/stats');
      setData(response.data);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError(err.response?.data?.error || 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 120_000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  // ── Loading ──
  if (loading && !data) return (
    <div className="flex justify-center items-center h-screen bg-white">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
    </div>
  );

  // ── Error ──
  if (error && !data) return (
    <div className="flex flex-col justify-center items-center h-screen bg-zinc-950 gap-4">
      <AlertCircleIcon className="h-12 w-12 text-red-400" />
      <p className="text-red-400 text-center">{error}</p>
      <button
        onClick={fetchDashboard}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition"
      >
        <RefreshCwIcon className="h-4 w-4" /> Reintentar
      </button>
    </div>
  );

  // Valores seguros si la data existe pero incompleta
  const stats = data?.stats || {
    revenue:      { current: 0, percentChange: 0 },
    reservations: { current: 0, percentChange: 0 },
    occupancy:    { current: 0, percentChange: 0 },
    averageHours: { current: 0, percentChange: 0 },
  };

  const recentReservations = data?.recentReservations || [];
  const occupancyByDay     = data?.occupancyByDay     || [];
  const revenueChartData   = data?.revenueChartData   || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Header con botones de navegación ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-makron font-bold text-background">
            Panel Administrativo
          </h1>
          <p className="text-gray-400 mt-2">
            Gestiona tu sala de juntas inteligente
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-600 mt-1">
              Actualizado: {lastUpdated.toLocaleTimeString('es-MX')}
            </p>
          )}
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          <Link
            to="/admin/calendar"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-600"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendario
          </Link>
          <Link
            to="/admin/users"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-600"
          >
            <UsersIcon className="h-4 w-4 mr-2" />
            Usuarios
          </Link>
          <Link
            to="/admin/settings"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-600"
          >
            <SettingsIcon className="h-4 w-4 mr-2" />
            Configuración
          </Link>
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-zinc-700 rounded-md text-sm text-gray-400 hover:bg-zinc-800 transition disabled:opacity-50"
            title="Actualizar datos"
          >
            <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Ingresos (Mes)</h3>
            <div className="bg-gray-800/50 p-2 rounded-lg">
              <DollarSignIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-white">
              ${Number(stats.revenue.current).toLocaleString('es-MX')}
            </p>
            <p className={`ml-2 text-sm ${Number(stats.revenue.percentChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Number(stats.revenue.percentChange) >= 0 ? '+' : ''}
              {stats.revenue.percentChange}%
            </p>
          </div>
          <p className="mt-1 text-xs text-gray-500">vs. mes anterior</p>
        </div>

        <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Reservas (Mes)</h3>
            <div className="bg-gray-800/50 p-2 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-white">
              {stats.reservations.current}
            </p>
            <p className={`ml-2 text-sm ${Number(stats.reservations.percentChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Number(stats.reservations.percentChange) >= 0 ? '+' : ''}
              {stats.reservations.percentChange}%
            </p>
          </div>
          <p className="mt-1 text-xs text-gray-500">vs. mes anterior</p>
        </div>

        <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Ocupación</h3>
            <div className="bg-gray-800/50 p-2 rounded-lg">
              <UsersIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-white">
              {stats.occupancy.current}%
            </p>
            <p className={`ml-2 text-sm ${Number(stats.occupancy.percentChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Number(stats.occupancy.percentChange) >= 0 ? '+' : ''}
              {stats.occupancy.percentChange}%
            </p>
          </div>
          <p className="mt-1 text-xs text-gray-500">vs. mes anterior</p>
        </div>

        <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Horas Promedio</h3>
            <div className="bg-gray-800/50 p-2 rounded-lg">
              <ClockIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-white">
              {stats.averageHours.current}h
            </p>
            <p className={`ml-2 text-sm ${Number(stats.averageHours.percentChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Number(stats.averageHours.percentChange) >= 0 ? '+' : ''}
              {stats.averageHours.percentChange}%
            </p>
          </div>
          <p className="mt-1 text-xs text-gray-500">vs. mes anterior</p>
        </div>
      </div>

      {/* ── Grid principal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Columna izquierda */}
        <div className="lg:col-span-2">

          {/* Reservas Recientes */}
          <div className="bg-zinc-900 rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-lg font-medium text-white">Reservas Recientes</h2>
              <Link to="/admin/calendar" className="text-sm text-gray-400 hover:text-gray-300">
                Ver todas
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-800">
                <thead className="bg-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha / Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Monto</th>
                  </tr>
                </thead>
                <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                  {recentReservations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No hay reservaciones recientes
                      </td>
                    </tr>
                  ) : (
                    recentReservations.map((reservation: RecentReservation) => (
                      <tr key={reservation.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{reservation.userName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {new Date(reservation.date).toLocaleDateString('es-MX')}
                          </div>
                          <div className="text-sm text-gray-400">{reservation.time}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(reservation.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          ${reservation.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gráfica Ingresos por Semana */}
          <div className="bg-zinc-900 rounded-lg shadow-lg mt-8 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-white">
                Ingresos por Semana (Últimas 7)
              </h2>
              <div>
                <select className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-gray-500">
                  <option>Últimos 2 meses</option>
                </select>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between px-2">
              {revenueChartData.length > 0 ? (
                revenueChartData.map((item: RevenueWeek, index: number) => (
                  <div key={index} className="flex flex-col items-center w-full group relative">
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs p-1 rounded">
                      ${item.amount.toLocaleString('es-MX')}
                    </div>
                    <div
                      className="w-full mx-1 bg-gradient-to-t from-gray-600 to-gray-500 rounded-t-sm hover:from-purple-600 hover:to-purple-500 transition-colors cursor-pointer"
                      style={{ height: `${item.heightPercent > 0 ? item.heightPercent : 1}%` }}
                    />
                    <div className="text-xs text-gray-400 mt-2 whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.week}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 w-full text-center">No hay datos de ingresos recientes.</p>
              )}
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-8">

          {/* Ocupación por Día */}
          <div className="bg-zinc-900 rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-medium text-white">Ocupación por Día Promedio</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {occupancyByDay.map((dayData: OccupancyDay) => {
                  const occupancy = dayData.percentage;
                  return (
                    <div key={dayData.day}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-300">{dayData.day}</span>
                        <span className="text-sm text-gray-300">{occupancy}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            occupancy >= 70 ? 'bg-green-500' :
                            occupancy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${occupancy}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
             {/* <Link
                to="/admin/reports"
                className="block w-full mt-4 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md text-center text-gray-300"
              >
                Ver análisis completo
              </Link>*/}
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="bg-zinc-900 rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-medium text-white">Acciones Rápidas</h2>
            </div>
            <div className="p-6 space-y-3">
              <Link
                to="/admin/calendar"
                className="block w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-md text-center text-white"
              >
                Ver Calendario
              </Link>
              <Link
                to="/admin/users"
                className="block w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md text-center text-gray-300"
              >
                Gestionar Usuarios
              </Link>
              <Link
                to="/admin/settings"
                className="block w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md text-center text-gray-300"
              >
                Configurar Precios
              </Link>
              <Link
                to="/admin/financial"
                className="block w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md text-center text-gray-300"
              >
                Ver Análisis Financiero
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;