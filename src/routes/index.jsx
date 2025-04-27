import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../pages/Dashboard';
import Lessons from '../pages/Lessons';
import Profile from '../pages/Profile';
import Assignments from '../pages/Assignments';
import Notes from '../pages/Notes';
import Settings from '../pages/Settings';
import Login from '../pages/auth/Login';
import VideoRoom from '../pages/VideoRoom';
import ProtectedRoute from '../components/ProtectedRoute';
import authService from '../services/auth';

const AppRoutes = () => {
  // Check if user is authenticated and is a student
  const isAuthenticated = authService.isAuthenticated();
  const isStudent = isAuthenticated && authService.isStudent();
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        isStudent ? <Navigate to="/dashboard" replace /> : <Login />
      } />
      
      {/* Redirect root based on auth status */}
      <Route path="/" element={
        isStudent ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
      } />

      {/* Video Room route - outside MainLayout */}
      <Route path="/room/:roomId" element={
        <ProtectedRoute>
          <VideoRoom />
        </ProtectedRoute>
      } />
      
      {/* Protected routes using the MainLayout */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="lessons" element={<Lessons />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="notes" element={<Notes />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
      {/* Fallback route for 404 */}
      <Route path="*" element={
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">404</h2>
            <p className="text-gray-600">Page not found</p>
          </div>
        </div>
      } />
    </Routes>
  );
};

export default AppRoutes; 