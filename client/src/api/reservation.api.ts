import api from './axios';

// Interfaces basadas en lo que devuelve tu Prisma y Controlador
export interface ReservationData {
  id: string;
  start_time: string; // El backend devolverá ISO Strings
  end_time: string;
  status: string; // 'PENDING', 'CONFIRMED', 'CANCELLED'
  total_paid: string | number;
  access_code: string | null;
  room?: {
    name: string;
  };
}

export interface CreateReservationPayload {
  roomId: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  termsAccepted: boolean;
  acceptedVersion: string;
}

// 1. Crear Reserva (POST)
export const createReservationRequest = async (data: CreateReservationPayload) => {
  // Enviamos los datos al endpoint que ya tienes definido en reservation.routes.ts
  return await api.post('/reservations', data);
};

// 2. Obtener Reservas del Usuario (GET)
export const getUserReservationsRequest = async () => {
  // NOTA: Asumimos que existirá este endpoint. Ver nota final.
  return await api.get('/reservations/my-reservations');
};