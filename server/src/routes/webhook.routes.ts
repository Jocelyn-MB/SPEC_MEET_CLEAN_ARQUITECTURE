import { Router } from 'express';
import { handleStripeWebhook } from '../controllers/webhook_controller';

const router = Router();
// El body raw ya viene aplicado en app.ts para esta ruta
router.post('/stripe', handleStripeWebhook);

export default router;