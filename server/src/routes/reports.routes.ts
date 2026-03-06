import { Router } from 'express';
import { getMonthlyReport, getFinancialOverview } from '../controllers/reports_controller';
import { authenticateToken } from '../middlewares/aut_middlewares';

const router = Router();

router.get('/monthly', authenticateToken, getMonthlyReport);
router.get('/overview', authenticateToken, getFinancialOverview);

export default router;