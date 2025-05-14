import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { settingsService } from '../../services/api';

const AccountSettings = ({ userData, onUpdate, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    first_name: userData?.first_name || '',
    last_name: userData?.last_name || '',
    email: userData?.email || '',
    phone_number: userData?.phone_number || '',
    date_of_birth: userData?.date_of_birth || '',
    street_address: userData?.street_address || '',
    profile_picture_url: userData?.profile_picture_url || ''
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(userData?.profile_picture_url || '');
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file is an image and not too large
    if (!file.type.match('image.*')) {
      onError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      onError('File size must be less than 5MB');
      return;
    }

    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Will be updated during form submission
    // In a real implementation, you would upload this file to your server
    setFormData(prev => ({ ...prev, profile_picture: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create FormData for file upload
      const data = new FormData();
      
      // Handle date of birth formatting
      const formattedData = { ...formData };
      if (formattedData.date_of_birth && formattedData.date_of_birth.trim() !== '') {
        // Ensure date is in YYYY-MM-DD format
        console.log('Original date:', formattedData.date_of_birth);
        const dateObj = new Date(formattedData.date_of_birth);
        if (!isNaN(dateObj.getTime())) {
          const formattedDate = dateObj.toISOString().split('T')[0];
          console.log('Formatted date:', formattedDate);
          formattedData.date_of_birth = formattedDate;
        }
      }
      
      // Add all form fields to FormData
      Object.keys(formattedData).forEach(key => {
        if (key === 'profile_picture' && formattedData[key]) {
          data.append(key, formattedData[key]);
        } else if (formattedData[key] !== null && formattedData[key] !== undefined) {
          data.append(key, formattedData[key]);
        }
      });

      console.log('Submitting form data:', Object.fromEntries(data.entries()));
      const response = await settingsService.updateStudentSettings(data);
      
      // Update local state with new data
      onUpdate(response.data);
      onSuccess('Account settings updated successfully!');
    } catch (err) {
      console.error('Error updating settings:', err);
      
      if (err.response?.data?.detail) {
        onError(err.response.data.detail);
      } else {
        onError('Failed to update account settings. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div>
      <h2 className="text-2xl font-medium text-primary mb-6">Account Settings</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
          <div className="relative group">
            <div 
              className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-gray-400"
              style={{ backgroundImage: imagePreview ? `url(${imagePreview})` : 'none' }}
              alt={userData?.first_name}
            >
              {!imagePreview && (
                <span className="text-3xl">
                  {userData?.first_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <motion.button
              type="button"
              onClick={triggerFileInput}
              className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 shadow-md"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </motion.button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          
          <div>
            <h3 className="font-medium text-gray-800">Profile Picture</h3>
            <p className="text-sm text-gray-500 mt-1">Upload a profile picture (max 5MB)</p>
          </div>
        </div>
        
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              required
            />
          </div>
          
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              readOnly
            />
            <p className="mt-1 text-xs text-gray-500">Email address cannot be changed</p>
          </div>
          
          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              placeholder="Enter your phone number"
            />
          </div>
          
          <div>
            <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              id="date_of_birth"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              placeholder="YYYY-MM-DD"
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="street_address" className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <input
              type="text"
              id="street_address"
              name="street_address"
              value={formData.street_address}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              placeholder="Enter your street address"
            />
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <motion.button
            type="submit"
            className="relative px-6 py-2 bg-primary text-white rounded-md font-medium overflow-hidden flex items-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
          >
            <span className="absolute inset-0 bg-white/20 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default AccountSettings; 