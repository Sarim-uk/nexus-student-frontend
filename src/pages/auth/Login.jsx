import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/auth';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const user = authService.getCurrentUser();
      if (user && user.role && user.role.toLowerCase() === 'student') {
        navigate('/dashboard');
      } else if (user) {
        // User is authenticated but not a student
        authService.logout();
        setError('Access denied. Only students can access this portal.');
      }
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!credentials.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!credentials.password) {
      newErrors.password = 'Password is required';
    } else if (credentials.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    
    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form inputs
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setErrors({});
    setLoading(true);
    
    try {
      const response = await authService.login(credentials.email, credentials.password);
      
      // Check if the user is a student
      if (response.user && response.user.role !== 'student') {
        setError('This portal is only for students. Please use the appropriate portal for your role.');
        return;
      }
      
      // Dispatch custom event for successful login
      window.dispatchEvent(new Event('loginSuccess'));
      
      // Redirect to dashboard
      navigate('/');
      
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response) {
        if (err.response.status === 401) {
          setError('Invalid email or password. Please try again.');
        } else if (err.response.data?.error) {
          setError(err.response.data.error);
        } else if (err.response.data?.detail) {
          setError(err.response.data.detail);
        } else {
          setError('Failed to login. Please check your credentials and try again.');
        }
      } else if (err.request) {
        setError('No response from server. Please check your connection and try again.');
      } else {
        setError('An error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-pattern-gold-diamonds bg-background overflow-hidden">
      {/* Abstract background elements with premium gold accents */}
      <div className="absolute inset-0 z-0 opacity-40 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gold opacity-10 rounded-full filter blur-3xl animate-gold-pulse"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary opacity-10 rounded-full filter blur-3xl"></div>
        <motion.div 
          className="absolute top-1/4 left-1/3 w-4 h-4 bg-gold rounded-full"
          animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/3 right-1/4 w-6 h-6 bg-gold rounded-full"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-serif font-semibold text-dark">
              Nexus <span className="text-primary">Portal</span>
            </h1>
            <p className="mt-3 text-sm text-gray-600 font-light">
              Access your premium learning dashboard
            </p>
          </motion.div>

          <motion.div 
            className="bg-white rounded-lg shadow-card border-1 border-gray-100 overflow-hidden"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="h-2 bg-gradient-to-r from-primary via-gold to-accent"></div>
            
            <div className="p-8">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border-l-4 border-error p-4 mb-6"
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-error">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={credentials.email}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-4 py-3 border ${
                        errors.email ? 'border-error' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors duration-200 bg-gray-50`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-error">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={credentials.password}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-4 py-3 border ${
                        errors.password ? 'border-error' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors duration-200 bg-gray-50`}
                      placeholder="Enter your password"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-error">{errors.password}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-gold focus:ring-gold border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <button 
                      type="button"
                      className="font-medium text-gold hover:text-gold-dark transition-colors"
                      onClick={() => alert('Password reset functionality will be implemented in a future update.')}
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <div>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="relative w-full flex justify-center py-3 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-primary shadow-sm transition-all duration-200 overflow-hidden group"
                    whileHover={{ 
                      scale: 1.01,
                      boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)'
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="absolute w-0 h-0 transition-all duration-300 ease-out bg-gold rounded-full group-hover:w-80 group-hover:h-80 opacity-20"></span>
                    
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      <span className="relative">Sign in</span>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-10 text-center"
          >
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Nexus Learning Portal. All rights reserved.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;