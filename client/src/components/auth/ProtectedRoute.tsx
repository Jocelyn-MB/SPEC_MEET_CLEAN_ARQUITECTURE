import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  adminOnly?: boolean;
}
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ adminOnly = false}) => {
  const {isAuthenticated, isLoading, user} = useAuth();

  if (isLoading) {
    return (<div className="flex items-center justify-center min-h-screen bg-white text-black">
        Loading...
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet/>;
};
export default ProtectedRoute;