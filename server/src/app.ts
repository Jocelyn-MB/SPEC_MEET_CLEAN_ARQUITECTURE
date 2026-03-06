import express, { Application } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';

// ---- Rutas ----
import authRoutes from './routes/auth.routes';
import roomRoutes from './routes/room.routes';
import reservationRoutes from './routes/reservation.routes';
import dashboardRoutes from './routes/dashboard.routes';
import adminSettingsRoutes from './routes/admin.settings.routes';
import usersRoutes from './routes/user.routes';
import webhookRoutes from './routes/webhook.routes';
import calendarRoutes from './routes/calendar.routes';
import reportsRoutes from './routes/reports.routes';

const app: Application = express();

// ============================================================
// SEGURIDAD
// ============================================================
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
}));

// ============================================================
// WEBHOOK DE STRIPE (debe ir ANTES de express.json())
// Stripe necesita el body RAW (sin parsear) para validar la firma
// ============================================================
app.use('/api/webhooks', express.raw({ type: '*/*' }), webhookRoutes);

// ============================================================
// PARSERS
// ============================================================
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// RUTAS DE LA API
// ============================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'SPEC.MEET API' });
});

// Auth
app.use('/api/auth', authRoutes);

// Salas
app.use('/api/rooms', roomRoutes);

// Reservaciones
app.use('/api/reservations', reservationRoutes);

// Dashboard Admin
app.use('/api/dashboard', dashboardRoutes);

// Configuración Admin
app.use('/api/admin/settings', adminSettingsRoutes);

// Usuarios Admin
app.use('/api/admin', usersRoutes);

// Calendario Admin (bloqueos)
app.use('/api/calendar', calendarRoutes);

// Reportes
app.use('/api/reports', reportsRoutes);

// ============================================================
// 404 HANDLER
// ============================================================
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.url} no encontrada` });
});

export default app;