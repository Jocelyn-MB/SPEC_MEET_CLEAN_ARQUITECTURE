import { Router } from "express";
import { getUsersWithReservations } from "../controllers/user_controllers";
import { authenticateToken } from "../middlewares/aut_middlewares";

const adminRoutes = Router();

// Endpoint que el frontend está buscando
adminRoutes.get('/users-with-reservations', authenticateToken, getUsersWithReservations);

export default adminRoutes;