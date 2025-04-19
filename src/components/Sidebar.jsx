import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/profile', label: 'Profile', icon: '👤' },
  { path: '/lessons', label: 'Lessons', icon: '📚' },
  { path: '/assignments', label: 'Assignments', icon: '📝' },
  { path: '/notes', label: 'Notes', icon: '📌' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('User data from localStorage:', parsedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);
  
  const handleLogout = async () => {
    try {
      // DEVELOPMENT MODE - Skip API call since endpoint isn't ready
      console.log('DEV MODE: Bypassing logout API call');
      
      // UNCOMMENT THIS WHEN BACKEND IS READY
      /*
      // Call logout API
      await authService.logout();
      */
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  // Get user's first initial for avatar
  const getInitial = () => {
    if (user) {
      if (user.first_name) {
        return user.first_name.charAt(0).toUpperCase();
      } else if (user.email) {
        return user.email.charAt(0).toUpperCase();
      }
    }
    return 'S'; // Default initial
  };

  // Get full name or truncated name if too long
  const getDisplayName = () => {
    if (user) {
      // Try to construct full name from first_name and last_name
      if (user.first_name || user.last_name) {
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        return fullName.length > 15 ? fullName.substring(0, 15) + '...' : fullName;
      }
      
      // Fallback to email if no name is available
      if (user.email) {
        const emailName = user.email.split('@')[0];
        return emailName.length > 15 ? emailName.substring(0, 15) + '...' : emailName;
      }
    }
    return 'Student';
  };

  return (
    <motion.div 
      className={`bg-white border-r border-gray-200 h-screen transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} flex flex-col relative z-20 shadow-md`}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4 flex justify-between items-center border-b border-gray-200">
        {!isCollapsed && (
          <motion.div
            className="flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-xl font-serif font-semibold text-primary">Nexus</span>
          </motion.div>
        )}
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="relative p-2 rounded-md bg-gray-50 text-gray-500 hover:text-primary transition-colors group overflow-hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="absolute inset-0 w-full h-full bg-primary/10 transform scale-0 rounded-md transition-transform group-hover:scale-100"></span>
          <span className="relative">{isCollapsed ? '→' : '←'}</span>
        </motion.button>
      </div>

      <nav className="mt-6 overflow-y-auto flex-1">
        <ul className="space-y-2 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive: activeLink }) => 
                    `flex items-center p-3 rounded-lg transition-all duration-200 overflow-hidden relative ${
                      isActive 
                        ? 'bg-primary text-white font-medium shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-primary'
                    }`
                  }
                >
                  {({ isActive: activeLink }) => (
                    <>
                      <span className="text-xl flex-shrink-0 mr-3 relative z-10">{item.icon}</span>
                      {!isCollapsed && (
                        <span className="truncate font-medium relative z-10">{item.label}</span>
                      )}
                      {!activeLink && (
                        <span className="absolute bottom-0 left-0 h-0.5 bg-accent transform scale-x-0 transition-transform origin-left group-hover:scale-x-100 w-full"></span>
                      )}
                      {!isCollapsed && activeLink && (
                        <motion.div
                          className="absolute left-0 bottom-0 h-full w-1 bg-accent"
                          layoutId="activeIndicator"
                        />
                      )}
                      {activeLink && (
                        <motion.div 
                          className="absolute inset-0 bg-primary"
                          initial={{ x: "-100%" }}
                          animate={{ x: 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Learning Resource Card */}
      {!isCollapsed && (
        <div className="px-4 py-3">
          <div className="bg-accent/5 rounded-lg p-3 border border-accent/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-accent/10 rounded-full transform translate-x-6 -translate-y-6"></div>
            <div className="relative">
              <h3 className="text-sm font-medium text-primary">Learning Resources</h3>
              <p className="text-xs text-gray-600 mt-1">Access study materials and additional resources</p>
              <button 
                className="mt-2 inline-flex items-center text-xs font-medium text-accent"
                onClick={() => {
                  alert('Learning resources will be available soon!');
                }}
              >
                <span>Explore now</span>
                <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student info section at bottom */}
      <div className={`w-full border-t border-gray-200 bg-gray-50 p-4 ${isCollapsed ? 'text-center' : ''}`}>
        <div className={`${isCollapsed ? 'flex flex-col items-center' : 'flex items-center'}`}>
          <div className="inline-flex items-center justify-center w-10 h-10 bg-primary text-white rounded-full flex-shrink-0 shadow-sm">
            <span className="font-medium">{getInitial()}</span>
          </div>
          {!isCollapsed && (
            <div className="ml-3 overflow-hidden">
              <p className="font-medium truncate max-w-[160px] text-gray-800">{getDisplayName()}</p>
              <motion.button 
                className="relative mt-1 px-4 py-1.5 rounded-md text-xs font-medium bg-transparent border border-gray-300 text-primary overflow-hidden group"
                onClick={handleLogout}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="absolute inset-0 bg-primary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                <span className="relative group-hover:text-white transition-colors duration-200">Logout</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar; 