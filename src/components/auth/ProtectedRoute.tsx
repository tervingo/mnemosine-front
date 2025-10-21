import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse delay-75"></div>
          <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirigir al login pero guardar la ubicación intentada
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;