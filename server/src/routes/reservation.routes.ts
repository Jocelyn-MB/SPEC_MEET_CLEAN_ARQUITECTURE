import { Router } from "express";
import { createReservation, getMyReservations } from "../controllers/reservation_controller";
import { authenticateToken } from "../middlewares/aut_middlewares"; 

const reservas = Router();

reservas.post('/', authenticateToken, createReservation);
reservas.get('/my-reservatios', authenticateToken, getMyReservations)
export default reservas;