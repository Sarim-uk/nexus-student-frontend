import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import authService from '../services/auth';

const MainLayout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Get current user from auth service
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
      // If no user is found, redirect to login
      navigate('/login');
      return;
    }
    
    // Check if user is a student
    if (currentUser.role && currentUser.role.toLowerCase() !== 'student') {
      // If user is not a student, log them out and redirect to login
      authService.logout();
      navigate('/login');
      return;
    }
    
    // Format user data for display
    setUser({
      name: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Student',
      email: currentUser.email,
      role: currentUser.role,
      avatar: currentUser.profile_picture_url || null,
    });
  }, [navigate]);

  if (!user) {
    // Show loading state while checking auth
    return (
      <div className="flex justify-center items-center h-screen bg-background bg-pattern-waves">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-opacity-30 border-t-primary"></div>
          <p className="mt-4 text-gray-600 font-light">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Background pattern */}
      <div className="fixed inset-0 bg-pattern-diamonds pointer-events-none"></div>
      
      {/* Subtle gradient orbs */}
      <div className="fixed -top-64 -right-64 w-[40rem] h-[40rem] bg-primary opacity-5 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="fixed -bottom-96 -left-64 w-[50rem] h-[50rem] bg-accent opacity-5 rounded-full filter blur-3xl pointer-events-none"></div>
      
      <Sidebar />
      
      <div className="flex flex-col flex-1 relative z-10">
        <Navbar user={user} />
        
        <motion.main 
          className="flex-1 overflow-y-auto p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default MainLayout; 