import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { settingsService } from '../services/api';

// Tab components
import AccountSettings from '../components/settings/AccountSettings';
import PasswordChange from '../components/settings/PasswordChange';
import NotificationPreferences from '../components/settings/NotificationPreferences';
import ThemeSettings from '../components/settings/ThemeSettings';

const tabs = [
  { id: 'account', label: 'Account', icon: '👤' },
  { id: 'password', label: 'Password', icon: '🔒' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'appearance', label: 'Appearance', icon: '🎨' },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Get user data from localStorage first for immediate display
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // Fetch the latest settings data from the server
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await settingsService.getStudentSettings();
        if (response.data) {
          // Update with the latest data from the server
          setUserData(prev => ({ ...prev, ...response.data }));
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Clear any success/error messages when changing tabs
    setSuccessMessage('');
    setError(null);
  };

  const updateUserData = (newData) => {
    setUserData(prev => ({ ...prev, ...newData }));
    
    // If the data contains user profile info, update localStorage
    if (newData.first_name || newData.last_name || newData.email || newData.profile_picture_url) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const updatedUser = { ...parsedUser, ...newData };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (e) {
          console.error('Error updating local user data:', e);
        }
      }
    }
  };

  const handleSuccess = (message) => {
    setSuccessMessage(message);
    setError(null);
    
    // Automatically clear the success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
  };

  const handleError = (message) => {
    setError(message);
    setSuccessMessage('');
  };

  // Render loading state
  if (loading && !userData) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-serif font-semibold text-primary mb-2">Settings</h1>
        <p className="text-gray-600 mb-8">Manage your account settings and preferences</p>
      </motion.div>

      {/* Success and Error Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 bg-success/10 border-l-4 border-success rounded-md p-4 text-success flex items-start"
          >
            <div className="flex-shrink-0 mr-3">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <span>{successMessage}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 bg-error/10 border-l-4 border-error rounded-md p-4 text-error flex items-start"
          >
            <div className="flex-shrink-0 mr-3">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex items-center py-4 px-6 text-sm font-medium transition-colors min-w-[120px] ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-primary/80'
              }`}
              whileHover={{ backgroundColor: 'rgba(26, 60, 97, 0.05)' }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="mr-2">{tab.icon}</span>
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  layoutId="activeTab"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'account' && (
                <AccountSettings
                  userData={userData}
                  onUpdate={updateUserData}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              )}
              
              {activeTab === 'password' && (
                <PasswordChange
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              )}
              
              {activeTab === 'notifications' && (
                <NotificationPreferences
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              )}
              
              {activeTab === 'appearance' && (
                <ThemeSettings
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings; 