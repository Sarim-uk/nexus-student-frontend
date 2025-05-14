import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { profileService } from '../../services/api';
import authService from '../../services/auth';
import dayjs from 'dayjs';
import useTutorRecommendations from '../../hooks/useTutorRecommendations';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100
    }
  }
};

const Profile = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    dob: '',
    address: '',
  });
  const [profileUpdated, setProfileUpdated] = useState(0); // Counter to track profile updates
  
  // Get recommendations (will update when profileUpdated changes)
  const { refetch: refreshRecommendations } = useTutorRecommendations({
    fetchOnMount: false,
    profileState: profileUpdated
  });

  // Function to fetch user data - moved outside useEffect so it can be called from anywhere in the component
  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current user from auth service
      const userData = authService.getCurrentUser();
      if (!userData) {
        throw new Error('User not authenticated');
      }
      
      console.log('Current user data:', userData);
      setUser(userData);
      
      // Initialize form with user data even without profile
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone: '',
        dob: '',
        address: '',
      });
      
      // Fetch profile data
      try {
        console.log('Fetching profile data...');
        const profileResponse = await profileService.getStudentProfile();
        console.log('Profile response:', profileResponse);
        
        if (profileResponse && profileResponse.data) {
          setProfile(profileResponse.data);
          
          // Log complete profile object structure to see all available fields
          console.log('COMPLETE PROFILE OBJECT:', JSON.stringify(profileResponse.data, null, 2));
          
          console.log('Setting form data with profile fields:', profileResponse.data);
          // Update form with profile data
          setFormData(prevData => {
            const updatedData = {
              ...prevData,
              phone: profileResponse.data.phone_number || profileResponse.data.phone || '',
              dob: profileResponse.data.date_of_birth || profileResponse.data.dob || '',
              address: profileResponse.data.street_address || profileResponse.data.address || '',
            };
            console.log('Updated form data:', updatedData);
            return updatedData;
          });
        }
      } catch (profileError) {
        console.log('Profile fetch error:', profileError);
        
        // For database schema errors (500) or not found (404), just continue with user data
        if ((profileError.response && profileError.response.status === 404) || 
            (profileError.response && profileError.response.status === 500)) {
          console.log('Using default profile values due to profile fetch error');
          // Already initialized above, no need to do anything
        } else {
          throw profileError;
        }
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Failed to load complete profile data. Basic information is shown, but some features may be limited.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    
    // Clear field-specific error when user edits the field
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};
    
    // Validate first name
    if (!formData.first_name || formData.first_name.trim() === '') {
      newErrors.first_name = 'First name is required';
    }
    
    // Validate last name
    if (!formData.last_name || formData.last_name.trim() === '') {
      newErrors.last_name = 'Last name is required';
    }
    
    // Validate phone (if provided)
    if (formData.phone && !/^[\d\s\-+()]*$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    
    // Validate date of birth (if provided)
    if (formData.dob) {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      if (isNaN(dobDate.getTime())) {
        newErrors.dob = 'Invalid date format';
      } else if (dobDate > today) {
        newErrors.dob = 'Date of birth cannot be in the future';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setFieldErrors({});
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Update user info first
      if (user?.id) {
        const userUpdateData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
        };
        
        console.log('Updating user info:', userUpdateData);
        await profileService.updateUserInfo(user.id, userUpdateData);
        console.log('User info update successful');
      }
      
      // Then update profile
      const profileUpdateData = {
        phone_number: formData.phone,
        date_of_birth: formData.dob,
        street_address: formData.address,
        
        // Try alternative field names
        phone: formData.phone,
        dob: formData.dob,
        address: formData.address,
        
        // Try using profile_meta for these fields
        profile_meta: {
          phone_number: formData.phone,
          date_of_birth: formData.dob,
          street_address: formData.address,
          
          phone: formData.phone,
          dob: formData.dob,
          address: formData.address
        },
        
        // Include learning preferences to preserve them
        visual_learning_preference: profile?.visual_learning_preference || 3,
        auditory_learning_preference: profile?.auditory_learning_preference || 3,
        reading_learning_preference: profile?.reading_learning_preference || 3,
        kinesthetic_learning_preference: profile?.kinesthetic_learning_preference || 3,
        
        // Include other required fields
        bio: profile?.bio || '',
        education: profile?.education || ''
      };
      
      console.log('Sending profile data:', profileUpdateData);
      const response = await profileService.updateStudentProfile(profileUpdateData);
      console.log('Profile update successful, response:', response);
      
      // Update localStorage user
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          first_name: formData.first_name,
          last_name: formData.last_name
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      // Show success message
      setSuccess('Profile updated successfully!');
      
      // Trigger recommendations refresh by updating the counter
      setProfileUpdated(prev => prev + 1);
      
      // Add a delay before refreshing to ensure backend has processed
      setTimeout(async () => {
        // Refresh user data
        console.log('Refreshing user data after update...');
        await fetchUserData();
        console.log('User data refreshed');
      }, 1000);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-gray-600 mb-8">View and edit your personal information</p>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-red-50 border-l-4 border-red-400 p-4 mb-6"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {success && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-green-50 border-l-4 border-green-400 p-4 mb-6"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left section - User Info */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-primary text-white rounded-full mb-4">
              <span className="text-3xl font-bold">
                {user?.first_name ? user.first_name.charAt(0) : 'S'}
              </span>
            </div>
            <h2 className="text-2xl font-semibold">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-gray-500">{user?.email}</p>
            <p className="mt-2 inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Student'}
            </p>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium mb-4">Account Information</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-gray-500 w-1/3">User ID:</span>
                <span className="font-medium">{user?.id || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 w-1/3">Account Type:</span>
                <span className="font-medium capitalize">{user?.role || 'Student'}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 w-1/3">Email:</span>
                <span className="font-medium">{user?.email || 'N/A'}</span>
              </div>
              {profile && (
                <>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-1/3">Phone:</span>
                    <span className="font-medium">{formData.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-1/3">Date of Birth:</span>
                    <span className="font-medium">
                      {formData.dob ? dayjs(formData.dob).format('MMMM D, YYYY') : 'Not provided'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-1/3">Address:</span>
                    <span className="font-medium">{formData.address || 'Not provided'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
        
        {/* Right section - Edit Form */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold mb-6">Edit Profile</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                {fieldErrors.first_name && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.first_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                {fieldErrors.last_name && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.last_name}</p>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="(123) 456-7890"
              />
              {fieldErrors.phone && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {fieldErrors.dob && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.dob}</p>
              )}
            </div>
            
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your address"
              ></textarea>
              {fieldErrors.address && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.address}</p>
              )}
            </div>
            
            <div className="flex justify-end">
              <motion.button
                type="submit"
                className="px-6 py-2 bg-primary text-white rounded-md font-medium"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : 'Save Changes'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Profile; 