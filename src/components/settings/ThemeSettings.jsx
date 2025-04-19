import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { settingsService } from '../../services/api';

// We'll create a custom React context for theme management in a real app
// For this example, we'll just use localStorage to persist the theme choice

const ThemeSettings = ({ onSuccess, onError }) => {
  const [themeMode, setThemeMode] = useState('light');
  const [followSystem, setFollowSystem] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load theme settings from localStorage
    const loadThemeSettings = () => {
      setLoading(true);
      try {
        const savedTheme = localStorage.getItem('theme');
        const savedFollowSystem = localStorage.getItem('followSystemTheme') === 'true';
        
        if (savedTheme) {
          setThemeMode(savedTheme);
        }
        
        setFollowSystem(savedFollowSystem);
        
        // Also try to load from backend if available
        fetchThemeFromServer();
      } catch (err) {
        console.error('Error loading theme settings:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchThemeFromServer = async () => {
      try {
        const response = await settingsService.getNotificationPreferences();
        if (response.data && response.data.theme) {
          setThemeMode(response.data.theme);
          setFollowSystem(response.data.follow_system_theme || false);
        }
      } catch (err) {
        console.error('Error fetching theme from server:', err);
        // Silently fail - we'll use localStorage values
      }
    };

    loadThemeSettings();
  }, []);

  useEffect(() => {
    // Apply theme to document when it changes
    if (loading) return;
    
    const applyTheme = (theme) => {
      // In a real implementation, you would add/remove the 'dark' class from the <html> tag
      // For this demo, we'll just update a console log
      document.documentElement.className = theme === 'dark' ? 'dark' : '';
      console.log(`Theme changed to: ${theme}`);
      
      // Store in localStorage
      localStorage.setItem('theme', theme);
      localStorage.setItem('followSystemTheme', followSystem.toString());
    };

    if (followSystem) {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
      
      // Set up listener for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Use the user's explicit preference
      applyTheme(themeMode);
    }
  }, [themeMode, followSystem, loading]);

  const handleThemeChange = async (theme) => {
    setThemeMode(theme);
    setFollowSystem(false);
    
    // Save to server
    saveThemePreference(theme, false);
  };

  const handleFollowSystemChange = async (e) => {
    const newFollowSystem = e.target.checked;
    setFollowSystem(newFollowSystem);
    
    // If following system, determine the current system theme
    if (newFollowSystem) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeMode(prefersDark ? 'dark' : 'light');
      
      // Save to server
      saveThemePreference(prefersDark ? 'dark' : 'light', true);
    } else {
      // Save to server with explicit theme
      saveThemePreference(themeMode, false);
    }
  };

  const saveThemePreference = async (theme, followSystemValue) => {
    setSaving(true);
    try {
      await settingsService.updateThemePreference({
        theme,
        follow_system_theme: followSystemValue
      });
      onSuccess('Theme preferences updated successfully!');
    } catch (err) {
      console.error('Error saving theme preference:', err);
      // We won't show an error to the user since the theme is still applied locally
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-accent border-t-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-medium text-primary mb-6">Theme & Appearance</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <motion.div
          className={`flex flex-col items-center p-6 rounded-lg border-2 cursor-pointer overflow-hidden transition-all relative ${
            themeMode === 'light' && !followSystem ? 'border-primary' : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => handleThemeChange('light')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Sun Icon */}
          <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mb-3 text-gold">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-800">Light Mode</h3>
          <p className="text-sm text-gray-500 text-center mt-1">
            Bright interface for daytime use
          </p>
          
          {themeMode === 'light' && !followSystem && (
            <div className="absolute top-2 right-2 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </motion.div>
        
        <motion.div
          className={`flex flex-col items-center p-6 rounded-lg border-2 cursor-pointer overflow-hidden transition-all relative ${
            themeMode === 'dark' && !followSystem ? 'border-primary' : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => handleThemeChange('dark')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Moon Icon */}
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-800">Dark Mode</h3>
          <p className="text-sm text-gray-500 text-center mt-1">
            Dark interface for reducing eye strain
          </p>
          
          {themeMode === 'dark' && !followSystem && (
            <div className="absolute top-2 right-2 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </motion.div>
      </div>
      
      <div className="my-6 flex items-center">
        <input
          type="checkbox"
          id="follow-system"
          checked={followSystem}
          onChange={handleFollowSystemChange}
          className="h-4 w-4 text-primary focus:ring-primary rounded"
        />
        <label htmlFor="follow-system" className="ml-2 block text-gray-700">
          Follow System Theme
        </label>
      </div>
      
      {followSystem && (
        <div className="p-4 bg-accent/5 border border-accent/20 rounded-md">
          <p className="text-sm text-gray-600">
            Your theme will automatically change based on your device's theme setting.
            {followSystem && themeMode === 'dark' ? 
              ' Your system is currently using dark mode.' : 
              ' Your system is currently using light mode.'}
          </p>
        </div>
      )}
      
      {saving && (
        <div className="mt-4 text-sm text-primary flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Saving preference...</span>
        </div>
      )}
      
      <div className="mt-8 p-4 border border-gray-200 rounded-md bg-gray-50">
        <h3 className="text-sm font-medium text-gray-800">About Theme Settings</h3>
        <p className="mt-1 text-sm text-gray-600">
          Theme settings are saved in your browser and will be applied each time you visit. 
          If you select "Follow System Theme," your theme will automatically change when your device's theme changes.
        </p>
      </div>
    </div>
  );
};

export default ThemeSettings; 