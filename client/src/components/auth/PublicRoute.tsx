import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-black" />; // Carga silenciosa

  // Si YA estás autenticado, te manda al Dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si NO estás autenticado, te deja ver el Login/Registro
  return <Outlet />;
};

export default PublicRoute;