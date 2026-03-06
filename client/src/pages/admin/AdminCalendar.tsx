import React, { useState, useEffect } from 'react';
import { ClockIcon, UserIcon, XCircleIcon, LockIcon, UnlockIcon, Loader, Calendar as CalendarIcon } from 'lucide-react';
import api from '../../api/axios';

interface CalendarReservation {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    user: { name: string; email: string };
}

interface CalendarBlock {
    id: string;
    start_time: string;
    end_time: string;
    reason: string;
}

type BlockType = 'hours' | 'fullDay' | 'range';

const AdminCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  
  // Datos
  const [reservations, setReservations] = useState<CalendarReservation[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<CalendarBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [roomId, setRoomId] = useState<string>("");

  // --- ESTADOS DEL FORMULARIO DE BLOQUEO ---
  const [blockType, setBlockType] = useState<BlockType>('hours');
  const [blockStartTime, setBlockStartTime] = useState('09:00');
  const [blockEndTime, setBlockEndTime] = useState('10:00');
  const [blockEndDate, setBlockEndDate] = useState(''); // Para rangos de fechas
  const [blockReason, setBlockReason] = useState('');

  // 1. Cargar Sala
  useEffect(() => {
    const fetchRoom = async () => {
        try {
            const res = await api.get('/rooms');
            if(res.data && res.data.length > 0) setRoomId(res.data[0].id);
        } catch (error) { console.error("Error cargando sala", error); }
    };
    fetchRoom();
  }, []);

  // 2. Cargar Eventos (Reservas + Bloqueos)
  useEffect(() => {
    if (!roomId) return;
    fetchMonthData();
  }, [currentDate, roomId]);

  const fetchMonthData = async () => {
    setIsLoading(true);
    try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const lastDay = new Date(year, month, 0).getDate();

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

        const res = await api.get('/reservations/range', {
            params: { roomId, startDate, endDate }
        });

        setReservations(res.data.reservations);
        setBlockedSlots(res.data.blocks);
    } catch (error) {
        console.error("Error calendario:", error);
    } finally {
        setIsLoading(false);
    }
  };

  // --- LÓGICA DE FECHAS ---
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const firstDayOfWeek = firstDayOfMonth.getDay(); 
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  
  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') newDate.setMonth(newDate.getMonth() - 1);
    else newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDayReservations = (day: Date) => {
    return reservations.filter(res => {
        const d = new Date(res.start_time);
        return d.getDate() === day.getDate() && d.getMonth() === day.getMonth();
    });
  };

  const getDayBlockedSlots = (day: Date) => {
    // Para mostrar el bloqueo en el día, verificamos si el día cae dentro del rango del bloqueo
    return blockedSlots.filter(block => {
        const startBlock = new Date(block.start_time);
        const endBlock = new Date(block.end_time);
        // Normalizamos a medianoche para comparar solo fechas
        const dayCheck = new Date(day); 
        dayCheck.setHours(12,0,0,0);
        
        // Ajustamos los limites del bloqueo para cubrir el día completo si abarca múltiples días
        const s = new Date(startBlock); s.setHours(0,0,0,0);
        const e = new Date(endBlock); e.setHours(23,59,59,999);

        return dayCheck >= s && dayCheck <= e;
    });
  };

  // --- CREAR BLOQUEO ---
  const handleBlockTimeSlot = async () => {
    if (!selectedDate || !roomId) return;

    try {
        const dateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
        let startISO, endISO;

        if (blockType === 'hours') {
            // Caso 1: Horas específicas hoy
            startISO = new Date(`${dateStr}T${blockStartTime}:00`).toISOString();
            endISO = new Date(`${dateStr}T${blockEndTime}:00`).toISOString();

        } else if (blockType === 'fullDay') {
            // Caso 2: Todo el día (00:00 a 23:59)
            startISO = new Date(`${dateStr}T00:00:00`).toISOString();
            endISO = new Date(`${dateStr}T23:59:59`).toISOString();

        } else if (blockType === 'range') {
            // Caso 3: Rango de fechas (Ej: Lunes a Viernes)
            if (!blockEndDate) {
                alert("Selecciona la fecha de fin");
                return;
            }
            startISO = new Date(`${dateStr}T00:00:00`).toISOString();
            endISO = new Date(`${blockEndDate}T23:59:59`).toISOString(); // Fin del último día
        }

        await api.post('/admin/settings/blocks', {
            roomId,
            startTime: startISO,
            endTime: endISO,
            reason: blockReason || "Mantenimiento"
        });

        alert("Bloqueo creado exitosamente");
        setShowBlockModal(false);
        setBlockReason('');
        setBlockType('hours'); // Reset
        fetchMonthData(); 
    } catch (error: any) {
        alert("Error: " + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
      if(!confirm("¿Desbloquear este horario?")) return;
      try {
          await api.delete(`/admin/settings/blocks/${blockId}`); 
          fetchMonthData();
      } catch (error) { console.error("Error eliminando bloqueo", error); }
  };

  // --- RENDER ---
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-makron text-3xl font-bold text-background">Calendario de Reservas</h1>
        <div className="flex space-x-3">
            {isLoading && <Loader className="animate-spin text-primary" />}
            <button onClick={() => { 
                setSelectedDate(new Date()); 
                setBlockEndDate(''); // Reset fecha fin
                setShowBlockModal(true); 
            }} 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-600">
                <LockIcon className="h-4 w-4 mr-2" />
                Bloquear Horario
            </button>
        </div>
      </div>

      {/* Calendario UI */}
      <div className="bg-zinc-900 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-white">
            {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex space-x-2">
            <button onClick={() => navigateMonth('prev')} className="p-2 rounded-md bg-zinc-800 text-gray-300 hover:bg-zinc-700">&lt;</button>
            <button onClick={() => setCurrentDate(new Date())} className="p-2 rounded-md bg-zinc-800 text-gray-300 hover:bg-zinc-700">Hoy</button>
            <button onClick={() => navigateMonth('next')} className="p-2 rounded-md bg-zinc-800 text-gray-300 hover:bg-zinc-700">&gt;</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="text-center p-2 font-medium text-gray-400 text-sm">{day}</div>
          ))}
          
          {calendarDays.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} className="h-24 bg-zinc-800/30 rounded-md"></div>;
            
            const dayReservations = getDayReservations(day);
            const dayBlockedSlots = getDayBlockedSlots(day);
            const isToday = day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth();
            
            return (
              <div key={day.toString()} 
                className={`h-24 p-1 rounded-md overflow-hidden ${isToday ? 'bg-gray-800/50 border border-gray-700' : 'bg-zinc-800'} cursor-pointer hover:bg-zinc-700`} 
                onClick={() => {
                    setSelectedDate(day);
                    // Pre-llenar fecha fin para el modal de rangos
                    setBlockEndDate(day.toISOString().split('T')[0]);
                }}>
                
                <div className={`text-right p-1 text-sm ${isToday ? 'font-bold text-white' : 'text-gray-300'}`}>
                  {day.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayReservations.length > 0 && (
                    <div className="px-1 py-0.5 text-xs bg-blue-900/30 text-blue-300 rounded truncate">
                      {dayReservations.length} rsv
                    </div>
                  )}
                  {dayBlockedSlots.length > 0 && (
                    <div className="px-1 py-0.5 text-xs bg-red-900/30 text-red-300 rounded truncate">
                      Bloqueado
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detalles del día seleccionado */}
      {selectedDate && (
        <div className="bg-zinc-900 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
            <h2 className="text-lg font-medium text-white">{formatDate(selectedDate)}</h2>
            <div className="flex space-x-2">
              <button onClick={() => { setBlockEndDate(selectedDate.toISOString().split('T')[0]); setShowBlockModal(true); }} 
                className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-xs font-medium text-white bg-gray-700 hover:bg-gray-600">
                <LockIcon className="h-3 w-3 mr-1" /> Bloquear
              </button>
              <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-white">
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {/* Lista de Reservas (Igual que antes) */}
            <h3 className="text-md font-medium text-gray-300 mb-4">Reservaciones</h3>
            {getDayReservations(selectedDate).length > 0 ? (
              <div className="space-y-3 mb-6">
                {getDayReservations(selectedDate).map(reservation => (
                  <div key={reservation.id} className="bg-zinc-800 p-3 rounded-lg flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-blue-900/30 p-2 rounded-md">
                        <ClockIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-white">
                          {new Date(reservation.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                          {new Date(reservation.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="text-xs text-gray-400">{reservation.user?.name}</div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-green-400">{reservation.status}</span>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-4 text-gray-500 mb-4">No hay reservaciones</div>}

            {/* Lista de Bloqueos */}
            <h3 className="text-md font-medium text-gray-300 mb-4">Horarios Bloqueados</h3>
            {getDayBlockedSlots(selectedDate).length > 0 ? (
              <div className="space-y-3">
                {getDayBlockedSlots(selectedDate).map(block => (
                  <div key={block.id} className="bg-zinc-800 p-3 rounded-lg flex justify-between items-center border border-red-900/30">
                    <div className="flex items-center">
                      <div className="bg-red-900/30 p-2 rounded-md">
                        <LockIcon className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-white">
                          {new Date(block.start_time).toLocaleDateString()} {new Date(block.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
                          {new Date(block.end_time).toLocaleDateString()} {new Date(block.end_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </div>
                        <div className="text-xs text-gray-400">{block.reason}</div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteBlock(block.id)} className="text-red-400 hover:text-red-300">
                      <UnlockIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-4 text-gray-500">No hay bloqueos</div>}
          </div>
        </div>
      )}

      {/* --- MODAL DE BLOQUEO MEJORADO --- */}
      {showBlockModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-white">Bloquear Disponibilidad</h3>
              <button onClick={() => setShowBlockModal(false)} className="text-gray-400 hover:text-white">
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6 space-y-4">
              <p className="text-gray-300">
                Iniciando el: <span className="font-medium text-white">{formatDate(selectedDate)}</span>
              </p>
              
              {/* SELECTOR DE TIPO DE BLOQUEO */}
              <div className="grid grid-cols-3 gap-2 bg-zinc-800 p-1 rounded-md">
                <button onClick={() => setBlockType('hours')} 
                    className={`text-xs py-2 rounded ${blockType === 'hours' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:bg-zinc-700'}`}>
                    Por Horas
                </button>
                <button onClick={() => setBlockType('fullDay')} 
                    className={`text-xs py-2 rounded ${blockType === 'fullDay' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:bg-zinc-700'}`}>
                    Día Completo
                </button>
                <button onClick={() => setBlockType('range')} 
                    className={`text-xs py-2 rounded ${blockType === 'range' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:bg-zinc-700'}`}>
                    Por Rango
                </button>
              </div>

              {/* OPCION 1: HORAS */}
              {blockType === 'hours' && (
                <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Desde</label>
                        <input type="time" value={blockStartTime} onChange={e => setBlockStartTime(e.target.value)} 
                            className="bg-zinc-800 w-full py-2 px-3 rounded border border-zinc-700 text-white" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Hasta</label>
                        <input type="time" value={blockEndTime} onChange={e => setBlockEndTime(e.target.value)} 
                            className="bg-zinc-800 w-full py-2 px-3 rounded border border-zinc-700 text-white" />
                    </div>
                </div>
              )}

              {/* OPCION 3: RANGO (FECHA FIN) */}
              {blockType === 'range' && (
                 <div className="animate-fadeIn">
                    <label className="block text-xs text-gray-400 mb-1">Bloquear hasta el día:</label>
                    <input type="date" value={blockEndDate} onChange={e => setBlockEndDate(e.target.value)} 
                        min={selectedDate.toISOString().split('T')[0]}
                        className="bg-zinc-800 w-full py-2 px-3 rounded border border-zinc-700 text-white" />
                    <p className="text-[10px] text-yellow-500 mt-1">
                        Se bloquearán todos los días completos desde la fecha seleccionada hasta esta fecha.
                    </p>
                 </div>
              )}

              {/* OPCION 2: DIA COMPLETO (SOLO TEXTO) */}
              {blockType === 'fullDay' && (
                  <div className="p-3 bg-blue-900/20 border border-blue-900/50 rounded text-xs text-blue-200 text-center animate-fadeIn">
                      Se bloqueará todo el día (00:00 - 23:59)
                  </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Motivo</label>
                <input type="text" value={blockReason} onChange={e => setBlockReason(e.target.value)} 
                    className="bg-zinc-800 w-full py-2 px-3 rounded-md border border-zinc-700 text-white placeholder-gray-500" 
                    placeholder="Ej: Mantenimiento, Remodelación..." />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowBlockModal(false)} className="px-4 py-2 border border-zinc-700 rounded-md text-gray-300 hover:bg-zinc-800">Cancelar</button>
              <button onClick={handleBlockTimeSlot} className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-white hover:bg-red-700">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendar;