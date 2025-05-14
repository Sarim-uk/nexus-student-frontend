import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { settingsService } from '../../services/api';

const PasswordChange = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation errors for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate current password is not empty
    if (!formData.current_password.trim()) {
      errors.current_password = 'Current password is required';
    }
    
    // Validate new password length and complexity
    if (formData.new_password.length < 8) {
      errors.new_password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/.test(formData.new_password)) {
      errors.new_password = 'Password must include at least one uppercase letter, one lowercase letter, and one number';
    }
    
    // Validate password confirmation matches
    if (formData.new_password !== formData.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate the form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await settingsService.updatePassword({
        current_password: formData.current_password,
        new_password: formData.new_password
      });
      
      // Clear form on success
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      onSuccess('Password changed successfully!');
    } catch (err) {
      console.error('Error changing password:', err);
      
      if (err.response?.data?.detail) {
        onError(err.response.data.detail);
      } else if (err.response?.data?.current_password) {
        setValidationErrors(prev => ({ 
          ...prev, 
          current_password: err.response.data.current_password[0] 
        }));
      } else if (err.response?.data?.new_password) {
        setValidationErrors(prev => ({ 
          ...prev, 
          new_password: err.response.data.new_password[0] 
        }));
      } else {
        onError('Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 25;
    
    // Character variety checks
    if (/[a-z]/.test(password)) strength += 15; // lowercase
    if (/[A-Z]/.test(password)) strength += 15; // uppercase
    if (/\d/.test(password)) strength += 15; // digits
    if (/[^a-zA-Z0-9]/.test(password)) strength += 20; // special chars
    
    // Length bonus
    if (password.length >= 12) strength += 10;
    
    return Math.min(100, strength);
  };

  const getPasswordStrengthLabel = (strength) => {
    if (strength < 30) return { color: 'bg-error', label: 'Weak' };
    if (strength < 60) return { color: 'bg-warning', label: 'Fair' };
    if (strength < 80) return { color: 'bg-accent', label: 'Good' };
    return { color: 'bg-success', label: 'Strong' };
  };

  const passwordStrength = calculatePasswordStrength(formData.new_password);
  const strengthInfo = getPasswordStrengthLabel(passwordStrength);

  return (
    <div>
      <h2 className="text-2xl font-medium text-primary mb-6">Change Password</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div>
          <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
            Current Password
          </label>
          <input
            type="password"
            id="current_password"
            name="current_password"
            value={formData.current_password}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              validationErrors.current_password ? 'border-error' : 'border-gray-300'
            }`}
            required
          />
          {validationErrors.current_password && (
            <p className="mt-1 text-sm text-error">{validationErrors.current_password}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            id="new_password"
            name="new_password"
            value={formData.new_password}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              validationErrors.new_password ? 'border-error' : 'border-gray-300'
            }`}
            required
          />
          {validationErrors.new_password && (
            <p className="mt-1 text-sm text-error">{validationErrors.new_password}</p>
          )}
          
          {/* Password strength indicator */}
          {formData.new_password && (
            <div className="mt-2">
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${strengthInfo.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${passwordStrength}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">Password Strength</p>
                <p className="text-xs font-medium">{strengthInfo.label}</p>
              </div>
            </div>
          )}
          
          <p className="mt-1 text-xs text-gray-500">
            Password must be at least 8 characters and include uppercase, lowercase, and numbers
          </p>
        </div>
        
        <div>
          <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirm_password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              validationErrors.confirm_password ? 'border-error' : 'border-gray-300'
            }`}
            required
          />
          {validationErrors.confirm_password && (
            <p className="mt-1 text-sm text-error">{validationErrors.confirm_password}</p>
          )}
        </div>
        
        <div className="pt-4">
          <motion.button
            type="submit"
            className="relative px-6 py-2 bg-primary text-white rounded-md font-medium overflow-hidden flex items-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Updating...</span>
              </>
            ) : (
              <span>Change Password</span>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default PasswordChange; 