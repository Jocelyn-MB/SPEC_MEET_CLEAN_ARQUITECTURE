import React, { useState, useEffect, useMemo } from 'react';
import { SearchIcon, UserIcon, ClockIcon, DollarSignIcon, PlusIcon, XCircleIcon, FilterIcon, Loader2 } from 'lucide-react';
import api from '../../api/axios';

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showAddHoursModal, setShowAddHoursModal] = useState(false);
  const [hoursToAdd, setHoursToAdd] = useState(1);
  const [filterActive, setFilterActive] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/users-with-reservations');
        const now = new Date();

        const processedUsers = response.data.map((user: any) => {
          const userReservations = user.reservations || [];

          // Cálculo dinámico de horas totales
          const totalHours = userReservations.reduce((acc: number, res: any) => {
            const duration = (new Date(res.end_time).getTime() - new Date(res.start_time).getTime()) / (1000 * 60 * 60);
            return acc + duration;
          }, 0);

          // Reservas Activas (Futuras y pagadas)
          const activeReservationsList = userReservations.filter((res: any) => 
            new Date(res.start_time) > now && res.status === 'PAID'
          );

          // Horas Pendientes
          const pendingHours = activeReservationsList.reduce((acc: number, res: any) => {
            const duration = (new Date(res.end_time).getTime() - new Date(res.start_time).getTime()) / (1000 * 60 * 60);
            return acc + duration;
          }, 0);

          return {
            ...user,
            totalHours: Math.round(totalHours),
            totalBilled: userReservations.reduce((acc: number, res: any) => acc + Number(res.total_paid), 0),
            activePlan: null, // Requerimiento: Sin plan activo por defecto
            pendingHours: Math.round(pendingHours),
            activeReservations: activeReservationsList.length,
            registrationDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
            lastActivity: 'Reciente',
            // Mapeo de reservaciones para la vista de detalle
            reservationsFormatted: activeReservationsList.map((res: any) => ({
                id: res.id,
                date: new Date(res.start_time).toLocaleDateString(),
                time: `${new Date(res.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
                resources: ['Sala Estándar'] // Valor por defecto
            }))
          };
        });

        setUsers(processedUsers);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleAddHours = () => {
    setShowAddHoursModal(false);
    alert(`Se han agregado ${hoursToAdd} horas al usuario ${selectedUser?.name} exitosamente.`);
  };

  const displayedUsers = useMemo(() => {
    let filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filterActive) {
      filtered = filtered.filter(user => user.activePlan !== null);
    }
    return filtered;
  }, [users, searchTerm, filterActive]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-black">
      <Loader2 className="h-10 w-10 text-gray-500 animate-spin mb-4" />
      <p className="text-gray-400">Cargando base de usuarios...</p>
    </div>
  );

  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-makron text-3xl font-bold text-background">Gestión de Usuarios</h1>
      </div>
      
      <div className="bg-zinc-900 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" placeholder="Buscar por nombre o email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-zinc-800 block w-full pl-10 pr-3 py-2 rounded-md border border-zinc-700 focus:ring-gray-500 focus:border-gray-500 text-white" />
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => setFilterActive(!filterActive)} className={`flex items-center px-4 py-2 rounded-md ${filterActive ? 'bg-gray-600 text-white' : 'bg-zinc-800 text-gray-300 border border-zinc-700'}`}>
              <FilterIcon className="h-4 w-4 mr-2" />
              Planes activos
            </button>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-medium text-white">
            Usuarios Registrados ({displayedUsers.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Usuario</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Horas Totales</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Facturado</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan Activo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Horas Pendientes</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Reservas Activas</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-zinc-900 divide-y divide-zinc-800">
              {displayedUsers.map(user => <tr key={user.id} className="hover:bg-zinc-800 transition-colors cursor-pointer" onClick={() => setSelectedUser(user)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{user.name}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white flex items-center">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                      {user.totalHours}h
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">${user.totalBilled.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.activePlan ? <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{user.activePlan}</span> : <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-zinc-700 text-gray-300">Sin plan</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {user.pendingHours > 0 ? <span className="text-green-400">{user.pendingHours}h</span> : <span className="text-gray-500">0h</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {user.activeReservations > 0 ? <span className="text-blue-400">{user.activeReservations}</span> : <span className="text-gray-500">0</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <button onClick={e => {
                      e.stopPropagation();
                      setSelectedUser(user);
                      setShowAddHoursModal(true);
                    }} className="text-gray-300 hover:text-white mr-3">
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && <div className="bg-zinc-900 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
            <h2 className="text-lg font-medium text-white">Detalles del Usuario</h2>
            <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-white">
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium text-gray-300 mb-2">Información Personal</h3>
                  <div className="bg-zinc-800 p-4 rounded-lg">
                    <div className="flex items-start mb-4">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-zinc-700 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium text-white">{selectedUser.name}</h4>
                        <p className="text-gray-400">{selectedUser.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="block text-gray-500">Fecha de registro</span><span className="text-white">{selectedUser.registrationDate}</span></div>
                      <div><span className="block text-gray-500">Última actividad</span><span className="text-white">{selectedUser.lastActivity}</span></div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-300 mb-2">Estadísticas de Uso</h3>
                  <div className="bg-zinc-800 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-700 p-3 rounded-lg">
                        <div className="flex items-center justify-between"><span className="text-gray-400 text-xs">Horas Totales</span><ClockIcon className="h-4 w-4 text-gray-400" /></div>
                        <div className="text-xl font-semibold text-white mt-1">{selectedUser.totalHours}h</div>
                      </div>
                      <div className="bg-zinc-700 p-3 rounded-lg">
                        <div className="flex items-center justify-between"><span className="text-gray-400 text-xs">Facturación</span><DollarSignIcon className="h-4 w-4 text-gray-400" /></div>
                        <div className="text-xl font-semibold text-white mt-1">${selectedUser.totalBilled.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-md font-medium text-gray-300 mb-2">Reservaciones Activas</h3>
                <div className="bg-zinc-800 p-4 rounded-lg min-h-[100px]">
                  {selectedUser.reservationsFormatted.length > 0 ? <div className="space-y-3">
                      {selectedUser.reservationsFormatted.map((reservation: any) => <div key={reservation.id} className="bg-zinc-700 p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div><div className="font-medium text-white">{reservation.date}</div><div className="text-sm text-gray-400">{reservation.time}</div></div>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-900/30 text-green-400 border border-green-900/50">Confirmada</span>
                            </div>
                          </div>)}
                    </div> : <div className="text-center py-6 text-gray-500">No hay reservaciones activas</div>}
                </div>
                <div className="mt-6 flex justify-end">
                  <button onClick={() => setShowAddHoursModal(true)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-zinc-700 hover:bg-zinc-600">
                    <PlusIcon className="h-4 w-4 mr-2" /> Agregar Horas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>}

      {showAddHoursModal && selectedUser && <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-lg shadow-xl max-w-md w-full p-6 border border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-white">Agregar Horas</h3>
              <button onClick={() => setShowAddHoursModal(false)} className="text-gray-400 hover:text-white"><XCircleIcon className="h-5 w-5" /></button>
            </div>
            <div className="mb-6">
              <p className="text-gray-300 mb-4">Agregando horas manualmente para: <span className="font-medium text-white">{selectedUser.name}</span></p>
              <div className="mb-4">
                <label htmlFor="hours" className="block text-sm font-medium text-gray-300 mb-1">Cantidad de horas</label>
                <input type="number" id="hours" min="1" value={hoursToAdd} onChange={e => setHoursToAdd(Number(e.target.value))} className="bg-zinc-800 block w-full py-2 px-3 rounded-md border border-zinc-700 focus:ring-gray-500 focus:border-gray-500 text-white" />
              </div>
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-1">Motivo (opcional)</label>
                <textarea id="reason" rows={3} className="bg-zinc-800 block w-full py-2 px-3 rounded-md border border-zinc-700 focus:ring-gray-500 focus:border-gray-500 text-white" placeholder="Ej: Compensación por falla técnica"></textarea>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowAddHoursModal(false)} className="px-4 py-2 border border-zinc-700 rounded-md text-gray-300 hover:bg-zinc-800">Cancelar</button>
              <button onClick={handleAddHours} className="px-4 py-2 bg-zinc-600 hover:bg-zinc-500 border border-transparent rounded-md text-white transition-colors">Confirmar</button>
            </div>
          </div>
        </div>}
    </div>;
};

export default UserManagement;