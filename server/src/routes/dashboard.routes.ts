import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboard_controller"; // Tu controlador de admin existente
import { authenticateToken } from "../middlewares/aut_middlewares";

const router = Router();

// Rutas Admin
router.get('/stats', authenticateToken, getDashboardStats);

export default router;