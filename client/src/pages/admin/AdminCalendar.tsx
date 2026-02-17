import React, { useState } from 'react';
import {  ClockIcon, UserIcon, XCircleIcon, LockIcon, UnlockIcon } from 'lucide-react';
const AdminCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockStartTime, setBlockStartTime] = useState('09:00');
  const [blockEndTime, setBlockEndTime] = useState('10:00');
  const [blockReason, setBlockReason] = useState('');
  // Get the first day of the month
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
  // Get the number of days in the month
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  // Generate array of days for the calendar
  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null); // Empty cells for days before the 1st of the month
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }
  // Function to navigate to previous/next month
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  // Mock data for reservations
  const reservations = [{
    id: '1',
    date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
    startTime: '10:00',
    endTime: '12:00',
    userName: 'Laura Martínez',
    status: 'confirmed'
  }, {
    id: '2',
    date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
    startTime: '14:00',
    endTime: '16:00',
    userName: 'Carlos Rodríguez',
    status: 'confirmed'
  }, {
    id: '3',
    date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 16),
    startTime: '09:00',
    endTime: '11:00',
    userName: 'Ana García',
    status: 'confirmed'
  }, {
    id: '4',
    date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 18),
    startTime: '13:00',
    endTime: '15:00',
    userName: 'Miguel López',
    status: 'cancelled'
  }, {
    id: '5',
    date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 20),
    startTime: '16:00',
    endTime: '18:00',
    userName: 'Patricia Sánchez',
    status: 'confirmed'
  }];
  // Mock data for blocked time slots
  const blockedSlots = [{
    id: 'b1',
    date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 17),
    startTime: '09:00',
    endTime: '12:00',
    reason: 'Mantenimiento'
  }, {
    id: 'b2',
    date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 22),
    startTime: '14:00',
    endTime: '18:00',
    reason: 'Evento privado'
  }];
  // Check if a day has reservations
  const getDayReservations = (day: Date) => {
    return reservations.filter(res => res.date.getDate() === day.getDate() && res.date.getMonth() === day.getMonth() && res.date.getFullYear() === day.getFullYear());
  };
  // Check if a day has blocked slots
  const getDayBlockedSlots = (day: Date) => {
    return blockedSlots.filter(block => block.date.getDate() === day.getDate() && block.date.getMonth() === day.getMonth() && block.date.getFullYear() === day.getFullYear());
  };
  // Handle block time slot
  const handleBlockTimeSlot = () => {
    // Here you would implement the actual logic to block the time slot
    // For now, we'll just close the modal
    setShowBlockModal(false);
    alert(`Horario bloqueado: ${selectedDate?.toLocaleDateString()} de ${blockStartTime} a ${blockEndTime}`);
  };
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">
          Calendario de Reservas
        </h1>
        <div className="flex space-x-3">
          <button onClick={() => {
          setSelectedDate(new Date());
          setShowBlockModal(true);
        }} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-600">
            <LockIcon className="h-4 w-4 mr-2" />
            Bloquear Horario
          </button>
        </div>
      </div>
      {/* Calendar navigation */}
      <div className="bg-zinc-900 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-white">
            {currentDate.toLocaleDateString('es-ES', {
            month: 'long',
            year: 'numeric'
          })}
          </h2>
          <div className="flex space-x-2">
            <button onClick={() => navigateMonth('prev')} className="p-2 rounded-md bg-zinc-800 text-gray-300 hover:bg-zinc-700">
              &lt;
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="p-2 rounded-md bg-zinc-800 text-gray-300 hover:bg-zinc-700">
              Hoy
            </button>
            <button onClick={() => navigateMonth('next')} className="p-2 rounded-md bg-zinc-800 text-gray-300 hover:bg-zinc-700">
              &gt;
            </button>
          </div>
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => <div key={day} className="text-center p-2 font-medium text-gray-400 text-sm">
              {day}
            </div>)}
          {/* Calendar days */}
          {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="h-24 bg-zinc-800/30 rounded-md"></div>;
          }
          const dayReservations = getDayReservations(day);
          const dayBlockedSlots = getDayBlockedSlots(day);
          const isToday = day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth() && day.getFullYear() === new Date().getFullYear();
          return <div key={day.toString()} className={`h-24 p-1 rounded-md overflow-hidden ${isToday ? 'bg-gray-800/50 border border-gray-700' : 'bg-zinc-800'} cursor-pointer hover:bg-zinc-700`} onClick={() => {
            setSelectedDate(day);
          }}>
                <div className={`text-right p-1 text-sm ${isToday ? 'font-bold text-white' : 'text-gray-300'}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayReservations.length > 0 && <div className="px-1 py-0.5 text-xs bg-blue-900/30 text-blue-300 rounded truncate">
                      {dayReservations.length} reserva(s)
                    </div>}
                  {dayBlockedSlots.length > 0 && <div className="px-1 py-0.5 text-xs bg-red-900/30 text-red-300 rounded truncate">
                      Bloqueado
                    </div>}
                </div>
              </div>;
        })}
        </div>
      </div>
      {/* Selected day details */}
      {selectedDate && <div className="bg-zinc-900 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
            <h2 className="text-lg font-medium text-white">
              {formatDate(selectedDate)}
            </h2>
            <div className="flex space-x-2">
              <button onClick={() => setShowBlockModal(true)} className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-xs font-medium text-white bg-gray-700 hover:bg-gray-600">
                <LockIcon className="h-3 w-3 mr-1" />
                Bloquear
              </button>
              <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-white">
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-md font-medium text-gray-300 mb-4">
              Reservaciones
            </h3>
            {getDayReservations(selectedDate).length > 0 ? <div className="space-y-3">
                {getDayReservations(selectedDate).map(reservation => <div key={reservation.id} className="bg-zinc-800 p-3 rounded-lg flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-blue-900/30 p-2 rounded-md">
                        <ClockIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-white">
                          {reservation.startTime} - {reservation.endTime}
                        </div>
                        <div className="flex items-center text-xs text-gray-400">
                          <UserIcon className="h-3 w-3 mr-1" />
                          {reservation.userName}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {reservation.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                    </span>
                  </div>)}
              </div> : <div className="text-center py-4 text-gray-500">
                No hay reservaciones para este día
              </div>}
            <h3 className="text-md font-medium text-gray-300 mt-6 mb-4">
              Horarios Bloqueados
            </h3>
            {getDayBlockedSlots(selectedDate).length > 0 ? <div className="space-y-3">
                {getDayBlockedSlots(selectedDate).map(block => <div key={block.id} className="bg-zinc-800 p-3 rounded-lg flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-red-900/30 p-2 rounded-md">
                        <LockIcon className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-white">
                          {block.startTime} - {block.endTime}
                        </div>
                        <div className="text-xs text-gray-400">
                          {block.reason}
                        </div>
                      </div>
                    </div>
                    <button className="text-red-400 hover:text-red-300">
                      <UnlockIcon className="h-4 w-4" />
                    </button>
                  </div>)}
              </div> : <div className="text-center py-4 text-gray-500">
                No hay horarios bloqueados para este día
              </div>}
          </div>
        </div>}
      {/* Block time modal */}
      {showBlockModal && selectedDate && <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-white">
                Bloquear Horario
              </h3>
              <button onClick={() => setShowBlockModal(false)} className="text-gray-400 hover:text-white">
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                Bloqueando horario para:{' '}
                <span className="font-medium text-white">
                  {formatDate(selectedDate)}
                </span>
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-300 mb-1">
                    Hora de inicio
                  </label>
                  <input type="time" id="startTime" value={blockStartTime} onChange={e => setBlockStartTime(e.target.value)} className="bg-zinc-800 block w-full py-2 px-3 rounded-md border border-zinc-700 focus:ring-gray-500 focus:border-gray-500 text-white" />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-300 mb-1">
                    Hora de fin
                  </label>
                  <input type="time" id="endTime" value={blockEndTime} onChange={e => setBlockEndTime(e.target.value)} className="bg-zinc-800 block w-full py-2 px-3 rounded-md border border-zinc-700 focus:ring-gray-500 focus:border-gray-500 text-white" />
                </div>
              </div>
              <div>
                <label htmlFor="blockReason" className="block text-sm font-medium text-gray-300 mb-1">
                  Motivo
                </label>
                <input type="text" id="blockReason" value={blockReason} onChange={e => setBlockReason(e.target.value)} className="bg-zinc-800 block w-full py-2 px-3 rounded-md border border-zinc-700 focus:ring-gray-500 focus:border-gray-500 text-white" placeholder="Ej: Mantenimiento, Evento privado, etc." />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowBlockModal(false)} className="px-4 py-2 border border-zinc-700 rounded-md text-gray-300 hover:bg-zinc-800">
                Cancelar
              </button>
              <button onClick={handleBlockTimeSlot} className="px-4 py-2 bg-gray-700 border border-transparent rounded-md text-white hover:bg-gray-600">
                Confirmar
              </button>
            </div>
          </div>
        </div>}
    </div>;
};
export default AdminCalendar;