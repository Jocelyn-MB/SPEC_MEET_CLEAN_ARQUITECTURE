import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-white" />;

   // Carga silenciosa
  // Si YA estás autenticado, te manda al Dashboard
  
  if (isAuthenticated) {
    if (isAuthenticated) {
    // 2. ...verificamos si es ADMIN para mandarlo a su panel
    if (user?.role === 'ADMIN') {
        return <Navigate to="/admin" replace />;
    }
    // 3. Si no es admin, entonces sí al dashboard normal
    return <Navigate to="/dashboard" replace />;
  }
}
  return <Outlet />;
};

export default PublicRoute;