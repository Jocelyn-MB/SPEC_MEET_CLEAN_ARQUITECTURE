import { Router } from 'express';
import {
  createReservation,
  getAvailability,
  getMyReservations,
  getMyReservationDates,
  cancelReservation,
  getAllReservations,
} from '../controllers/reservation_controller';
import { authenticateToken } from '../middlewares/aut_middlewares';

const router = Router();

// Disponibilidad (pública para ver el calendario)
router.get('/availability', getAvailability);

// Reservas del usuario logueado
router.get('/my', authenticateToken, getMyReservations);
router.get('/my-dates', authenticateToken, getMyReservationDates);

// CRUD de reservas
router.post('/', authenticateToken, createReservation);
router.delete('/:id', authenticateToken, cancelReservation);

// Admin: todas las reservas
router.get('/all', authenticateToken, getAllReservations);

export default router;