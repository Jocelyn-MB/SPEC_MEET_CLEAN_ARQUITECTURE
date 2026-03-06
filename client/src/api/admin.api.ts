import api from './axios';

// Obtener todos los eventos (reservas + bloqueos) para el calendario admin
export const getAdminCalendarEvents = async (roomId: string, month: number, year: number) => {
    // Nota: El backend que hicimos (getReservationsByDate) pedía una fecha específica.
    // Para el calendario mensual, lo ideal sería un endpoint que traiga todo el mes,
    // pero por ahora podemos reutilizar el endpoint de rangos o pedir día por día.
    //
    // ESTRATEGIA MEJORADA: Vamos a pedir un rango grande (del 1 al 31 del mes)
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;
    
    // Necesitamos actualizar el backend para soportar rangos (start-end), 
    // pero por ahora usemos el endpoint actual iterando o ajustándolo.
    // *Para simplificar hoy, asumiremos que modificamos getReservationsByDate para aceptar rango.*
    
    return await api.get(`/reservations/range`, { 
        params: { roomId, startDate, endDate } 
    });
};

export const createBlock = async (data: { roomId: string, startTime: string, endTime: string, reason: string }) => {
    return await api.post('/admin/settings/blocks', data);
};

export const deleteBlock = async (blockId: string) => {
    return await api.delete(`/admin/settings/blocks/${blockId}`);
};