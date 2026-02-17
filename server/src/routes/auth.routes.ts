import { Router } from "express";
import { login, register, logout, verifySession, forgotPassowrd, resetPassword } from "../controllers/aut_controller";
import { authenticateToken } from "../middlewares/aut_middlewares";

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/verify', authenticateToken, verifySession);
router.post('/forgot-password', forgotPassowrd);
router.post('/reset-password/:token', resetPassword);

export default router;