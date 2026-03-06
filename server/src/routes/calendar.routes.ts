import { Router } from 'express';
import { getCalendarReservations, blockTimeSlot, deleteBlockSlot } from '../controllers/calendar_controller';
import { authenticateToken } from '../middlewares/aut_middlewares';

const router = Router();

router.get('/reservations', authenticateToken, getCalendarReservations);
router.post('/block', authenticateToken, blockTimeSlot);
router.delete('/block/:id', authenticateToken, deleteBlockSlot);

export default router;