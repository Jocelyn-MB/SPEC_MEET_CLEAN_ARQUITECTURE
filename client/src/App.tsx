import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';

// Componentes de protección
import ProtectedRoute from './components/auth/ProtectedRoute';
import ResetPasswordPage from './pages/user/ResetPasswordPage';
import PublicRoute from './components/auth/PublicRoute';       // Ajusta la ruta si es necesario
import Layout from './components/Layout';

// Páginas Públicas
import ForgotPasswordPage from './pages/user/ForgotPasswordPage';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import GalleryPage from './pages/GalleryPage';
import PlansPage from './pages/PlansPage';
import TCPage from './pages/TCPage';

// Páginas de Autenticación
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Páginas de Usuario
import UserDashboard from './pages/user/UserDashboard';
import BookingPage from './pages/user/BookingPage';

// Páginas de Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSettings from './pages/admin/AdminSettings';
import AdminFinancial from './pages/admin/AdminFinancial';
import AdminReports from './pages/admin/AdminReports';
import UserManagement from './pages/admin/UserManagement';
import AdminCalendar from './pages/admin/AdminCalendar';

// Wrapper auxiliar para que el Layout funcione con Rutas anidadas
const LayoutWrapper = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* ---------------------------------------------------------------
          GRUPO 1: RUTAS PÚBLICAS GENERALES (Accesibles por todos)
          Todas estas rutas tendrán el Navbar/Footer del Layout
      ---------------------------------------------------------------- */}
      <Route element={<LayoutWrapper />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/terms-and-conditions" element={<TCPage />} />
      </Route>

      {/* ---------------------------------------------------------------
          GRUPO 2: RUTAS DE AUTENTICACIÓN (Solo para NO logueados)
          Si ya estás logueado, PublicRoute te manda al Dashboard
      ---------------------------------------------------------------- */}
      <Route element={<PublicRoute />}>
        <Route element={<LayoutWrapper />}>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      {/* ---------------------------------------------------------------
          GRUPO 3: RUTAS PROTEGIDAS DE USUARIO
          Requieren Login. Si no, te manda al Login.
      ---------------------------------------------------------------- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<LayoutWrapper />}>
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/booking" element={<BookingPage />} />
        </Route>
      </Route>

      {/* ---------------------------------------------------------------
          GRUPO 4: RUTAS PROTEGIDAS DE ADMIN
          Requieren Login Y ser Rol ADMIN.
      ---------------------------------------------------------------- */}
      <Route path="/admin" element={<ProtectedRoute adminOnly={true} />}>
        <Route element={<LayoutWrapper />}>
            <Route index element={<AdminDashboard />} /> {/* /admin */}
            <Route path="settings" element={<AdminSettings />} />
            <Route path="financial" element={<AdminFinancial />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="calendar" element={<AdminCalendar />} />
        </Route>
      </Route>

      {/* Ruta 404 (Opcional, por si escriben algo raro) */}
      <Route path="*" element={<Layout><div>Página no encontrada</div></Layout>} />
    </Routes>
  );
};