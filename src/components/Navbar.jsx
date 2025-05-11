import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Navbar = ({ user }) => {
  const [userData, setUserData] = useState(user || null);
  
  useEffect(() => {
    // If user prop is not provided, try to get from localStorage
    if (!userData) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUserData(JSON.parse(storedUser));
        } catch (e) {
          console.error('Error parsing user data in Navbar:', e);
        }
      }
    }
  }, [userData]);

  // Get user's display name
  const getDisplayName = () => {
    if (userData) {
      if (userData.name) {
        return userData.name;
      } else if (userData.first_name || userData.last_name) {
        return `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
      } else if (userData.email) {
        return userData.email.split('@')[0];
      }
    }
    return 'Student';
  };

  return (
    <motion.div
      className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 relative z-20 shadow-sm"
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center">
        <Link to="/dashboard" className="group flex items-center">
          <span className="text-2xl font-serif font-semibold text-primary relative">
            Nexus Academy UK
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300"></span>
          </span>
          <span className="ml-2 text-xs font-medium text-gray-500 uppercase tracking-wider mt-1 bg-gray-50 px-2 py-1 rounded">Student Portal</span>
        </Link>
      </div>
      
      {userData && (
        <motion.div 
          className="flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="hidden md:flex items-center mr-6">
            <div className="h-2 w-2 bg-success rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm text-gray-600">Online</span>
          </div>
          
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <span className="text-sm text-gray-600 mr-3">Welcome,</span>
            <div className="flex items-center relative">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-medium relative overflow-hidden group">
                <span className="relative z-10">{getDisplayName().charAt(0).toUpperCase()}</span>
                <span className="absolute inset-0 bg-primary transform scale-0 group-hover:scale-100 transition-transform duration-300 rounded-full"></span>
                <span className="absolute inset-0 bg-secondary transform scale-0 group-hover:scale-100 transition-transform duration-500 delay-100 rounded-full opacity-0 group-hover:opacity-30"></span>
              </div>
              <span className="ml-2 font-medium text-gray-800 hidden sm:inline-block relative group">
                {getDisplayName()}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary/20 group-hover:w-full transition-all duration-300"></span>
              </span>
            </div>
          </motion.div>
          
          <div className="ml-4 h-6 w-px bg-gray-200 hidden sm:block"></div>
          
          <div className="ml-4 hidden sm:block">
            <Link to="/settings">
              <motion.div
                className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer overflow-hidden group"
                whileHover={{ rotate: 15 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <span className="absolute inset-0 bg-primary/5 transform scale-0 group-hover:scale-100 transition-transform duration-300 rounded-full"></span>
                <span className="relative z-10 text-lg">⚙️</span>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Navbar; 