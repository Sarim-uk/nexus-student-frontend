import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { settingsService } from '../../services/api';

const Toggle = ({ label, description, checked, onChange, id }) => {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div>
        <label htmlFor={id} className="font-medium text-gray-800">{label}</label>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="relative">
        <input 
          type="checkbox" 
          id={id} 
          checked={checked} 
          onChange={onChange}
          className="sr-only"
        />
        <motion.div 
          className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-300'}`}
          onClick={() => onChange({ target: { checked: !checked } })}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div 
            className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm"
            animate={{ x: checked ? 24 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
        </motion.div>
      </div>
    </div>
  );
};

const NotificationPreferences = ({ onSuccess, onError }) => {
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    sms_alerts: false,
    assignment_reminders: true,
    session_alerts: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch user notification preferences
    const fetchPreferences = async () => {
      setLoading(true);
      try {
        const response = await settingsService.getNotificationPreferences();
        if (response.data) {
          setPreferences(response.data);
        }
      } catch (err) {
        console.error('Error fetching notification preferences:', err);
        onError('Failed to load notification preferences. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [onError]);

  const handleToggleChange = (key) => (e) => {
    const newPreferences = { ...preferences, [key]: e.target.checked };
    setPreferences(newPreferences);
    
    // Save changes immediately
    savePreferences(newPreferences);
  };

  const savePreferences = async (data) => {
    setSaving(true);
    try {
      await settingsService.updateNotificationPreferences(data);
      onSuccess('Notification preferences updated successfully!');
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      onError('Failed to update notification preferences. Please try again.');
      // Revert changes if update fails
      setPreferences(preferences);
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
      <h2 className="text-2xl font-medium text-primary mb-6">Notification Preferences</h2>
      
      <div className="bg-white rounded-lg">
        <Toggle
          id="email-notifications"
          label="Email Notifications"
          description="Receive important updates and announcements via email"
          checked={preferences.email_notifications}
          onChange={handleToggleChange('email_notifications')}
        />
        
        <Toggle
          id="sms-alerts"
          label="SMS Alerts"
          description="Get text message alerts for urgent notifications"
          checked={preferences.sms_alerts}
          onChange={handleToggleChange('sms_alerts')}
        />
        
        <Toggle
          id="assignment-reminders"
          label="Assignment Reminders"
          description="Receive reminders about upcoming assignment deadlines"
          checked={preferences.assignment_reminders}
          onChange={handleToggleChange('assignment_reminders')}
        />
        
        <Toggle
          id="session-alerts"
          label="Session Start Alerts"
          description="Get notified 15 minutes before your scheduled sessions"
          checked={preferences.session_alerts}
          onChange={handleToggleChange('session_alerts')}
        />
      </div>
      
      {saving && (
        <div className="mt-4 text-sm text-primary flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Saving changes...</span>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-accent/5 border border-accent/20 rounded-md">
        <h3 className="text-sm font-medium text-primary">About Notifications</h3>
        <p className="mt-1 text-sm text-gray-600">
          Customize how and when you receive notifications. Your preferences are saved automatically when you toggle an option.
        </p>
      </div>
    </div>
  );
};

export default NotificationPreferences; 