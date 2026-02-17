import e, { Router } from "express";
import { createRoom, deleteRoom, getRoomById, getRooms, updateRoom } from "../controllers/room_controllers";
import { authenticateToken } from "../middlewares/aut_middlewares";
import router from "./auth.routes";

const routerRoom = Router();

routerRoom.post('/', authenticateToken, createRoom);
routerRoom.get('/', getRooms);

routerRoom.get('/:id', getRoomById);
routerRoom.put('/:id', authenticateToken, updateRoom);
routerRoom.delete('/:id',authenticateToken, deleteRoom);

export default routerRoom;