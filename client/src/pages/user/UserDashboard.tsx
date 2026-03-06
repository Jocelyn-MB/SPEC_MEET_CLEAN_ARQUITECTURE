import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, ClockIcon, KeyIcon, Loader2, XCircleIcon, AlertCircleIcon } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

interface Reservation {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  totalPaid: number;
  accessCode: string | null;
  status: string;
  roomName: string;
  canCancel: boolean;
}

interface DashboardData {
  stats: { activeReservations: number; totalHours: number; nextReservationDate: string };
  upcoming: Reservation[];
  past: Reservation[];
}

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const { data: res } = await api.get('/reservations/my');
      setData(res);
    } catch (err) {
      setError('Error al cargar tus reservas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCancel = async (reservationId: string) => {
    if (!confirm('¿Seguro que quieres cancelar esta reserva?')) return;
    setCancelling(reservationId);
    try {
      await api.delete(`/reservations/${reservationId}`);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al cancelar');
    } finally {
      setCancelling(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      PAID:      { bg: 'bg-green-900/30 border-green-900/50', text: 'text-green-400', label: 'Confirmada' },
      COMPLETED: { bg: 'bg-blue-900/30 border-blue-900/50',  text: 'text-blue-400',  label: 'Completada' },
      PENDING:   { bg: 'bg-yellow-900/30 border-yellow-900/50', text: 'text-yellow-400', label: 'Pendiente' },
      CANCELLED: { bg: 'bg-red-900/30 border-red-900/50',    text: 'text-red-400',   label: 'Cancelada' },
      EXPIRED:   { bg: 'bg-gray-900/30 border-gray-900/50',  text: 'text-gray-400',  label: 'Expirada' },
    };
    const s = map[status] ?? { bg: 'bg-gray-900/30 border-gray-700', text: 'text-gray-400', label: status };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-10 w-10 text-white animate-spin" />
      </div>
    );
  }

  const stats = data?.stats ?? { activeReservations: 0, totalHours: 0, nextReservationDate: '--' };
  const upcoming = data?.upcoming ?? [];
  const past     = data?.past     ?? [];
  const displayed = activeTab === 'upcoming' ? upcoming : past;

  return (
    <div className="w-full min-h-screen relative">
      {/* Fondo */}
      <div
        className="fixed inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('https://uploadthingy.s3.us-west-1.amazonaws.com/mnx4A3B36Dy2nyF5i8QPC8/PHOTO-2025-02-03-12-44-43.jpg')" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Mi Panel</h1>
          <p className="text-white/80 mt-1">Bienvenido, {user?.name}. Gestiona tus reservas desde aquí.</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircleIcon className="h-5 w-5 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { icon: CalendarIcon, label: 'Reservas Activas', value: stats.activeReservations },
            { icon: ClockIcon,    label: 'Horas Reservadas', value: `${stats.totalHours}h` },
            { icon: KeyIcon,      label: 'Próxima Reserva',  value: stats.nextReservationDate },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10 shadow-lg">
              <div className="flex items-center">
                <div className="p-2 rounded-lg mr-3"><Icon className="h-5 w-5 text-white" /></div>
                <div>
                  <p className="text-sm text-white/80">{label}</p>
                  <p className="text-lg font-semibold text-white">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabla de reservas */}
        <div className="bg-black/40 backdrop-blur-sm rounded-lg shadow-lg border border-white/10">
          <div className="border-b border-white/10 px-6 py-4 flex justify-between items-center">
            <div className="flex gap-3">
              {(['upcoming', 'past'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all border border-white/10 text-white ${activeTab === tab ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  {tab === 'upcoming' ? 'Próximas' : 'Historial'}
                </button>
              ))}
            </div>
            <Link to="/booking" className="px-4 py-2 text-sm font-medium bg-white text-black rounded-md hover:bg-gray-200 transition-colors">
              + Nueva Reserva
            </Link>
          </div>

          <div className="p-6">
            {displayed.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/60 mb-4">
                  {activeTab === 'upcoming' ? 'No tienes reservas próximas' : 'No tienes reservas pasadas'}
                </p>
                {activeTab === 'upcoming' && (
                  <Link to="/booking" className="inline-flex items-center px-4 py-2 border border-white/30 text-sm rounded-md text-white bg-white/15 hover:bg-white/30 transition-all">
                    Reservar Ahora
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {displayed.map(r => (
                  <div key={r.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-white/70" />
                          <span className="text-white font-medium">
                            {new Date(`${r.date}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-white/70" />
                          <span className="text-white/90">{r.startTime} – {r.endTime}</span>
                        </div>
                        {r.accessCode && r.status === 'PAID' && (
                          <div className="flex items-center gap-2">
                            <KeyIcon className="h-4 w-4 text-white/70" />
                            <span className="text-white/90">
                              Código:{' '}
                              <span className="font-mono font-bold tracking-wider bg-white/10 px-2 py-0.5 rounded">
                                {r.accessCode}
                              </span>
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          {getStatusBadge(r.status)}
                          <span className="text-xs text-white/50">${r.totalPaid.toFixed(2)} MXN</span>
                        </div>
                      </div>

                      {r.canCancel && (
                        <button
                          onClick={() => handleCancel(r.id)}
                          disabled={cancelling === r.id}
                          className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                        >
                          {cancelling === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircleIcon className="h-4 w-4" />}
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;