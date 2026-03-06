import { Router } from 'express';
import {
  getPricingSettings, updatePricingSettings,
  getLocationSettings, updateLocationSettings,
  getTermsSettings, updateTermsSettings,
  getWifiSettings, updateWifiSettings,
  getOperationalSettings, updateOperationalSettings,
} from '../controllers/admin_settings_controller';
import { authenticateToken } from '../middlewares/aut_middlewares';

const router = Router();

// Precios
router.get('/pricing', getPricingSettings);
router.put('/pricing', authenticateToken, updatePricingSettings);

// Ubicación y horarios
router.get('/location', getLocationSettings);
router.put('/location', authenticateToken, updateLocationSettings);

// Términos y condiciones
router.get('/terms', getTermsSettings);
router.put('/terms', authenticateToken, updateTermsSettings);

// Wi-Fi
router.get('/wifi', getWifiSettings);
router.put('/wifi', authenticateToken, updateWifiSettings);

// Políticas operacionales
router.get('/operational', getOperationalSettings);
router.put('/operational', authenticateToken, updateOperationalSettings);

export default router;