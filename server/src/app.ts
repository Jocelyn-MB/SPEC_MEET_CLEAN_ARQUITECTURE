import express, {Application} from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import routerRoom from './routes/room.routes';
import dashboardRoutes from './routes/dashboard.routes';
import adminSettingsRoutes from './routes/admin.settings.routes';
import usersRoutes from './routes/user.routes';
import webhookRoutes from './routes/webhook.routes'

const app: Application = express();

app.use(helmet());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'DELETE','PUT', 'OPTIONS']
}));

app.use(cookieParser());
app.use('/api/webhooks', express.raw({type: '*/*'}),webhookRoutes);
app.use(express.json());


app.use('/api/auth', authRoutes);
app.get('/', (req, res)=>{
    res.send('API de SPEC.MEET funcionando y segura');
});

app.use('/api/rooms', routerRoom)


app.use('/api/admin/settings', adminSettingsRoutes);

app.use('/api/admin', usersRoutes);

app.use('/api/dashboard', dashboardRoutes);

export default app;