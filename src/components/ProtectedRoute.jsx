import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/auth';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          console.log('Not authenticated, redirecting to login');
          setIsAuthorized(false);
          return;
        }
        
        // Check if the current user is a student
        const isStudent = authService.isStudent();
        if (!isStudent) {
          console.log('User is not a student, redirecting to login');
          authService.logout(); // Clear auth data
          setIsAuthorized(false);
          return;
        }
        
        // User is authenticated and is a student
        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        
        // If there's an error, attempt to refresh the token
        try {
          await authService.refreshToken();
          
          // After refresh, check again if user is a student
          if (authService.isStudent()) {
            setIsAuthorized(true);
            return;
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
        
        // If we reach here, logout and redirect to login
        authService.logout();
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If not authorized, redirect to login
  if (!isAuthorized) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If authorized, render children
  return children;
};

export default ProtectedRoute; 