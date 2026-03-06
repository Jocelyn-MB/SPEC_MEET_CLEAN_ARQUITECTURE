import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { startNotificationCron } from './jobs/notification.cron';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor SPEC.MEET corriendo en http://localhost:${PORT}`);
  console.log(`📦 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  
  // Iniciar job de notificaciones
  startNotificationCron();
  console.log('⏰ Cron de notificaciones iniciado');
});