import dotenv from 'dotenv'; // 1. Importar dotenv primero
dotenv.config();             // 2. CONFIGURARLO INMEDIATAMENTE

import app from './app';     // 3. Ahora sí, importar la app (ya tendrá acceso a las variables)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});