import api from './api';

// Auth helper functions
const authService = {
  // Login function
  login: async (email, password) => {
    try {
      const response = await api.post('/login/', { email, password });
      
      if (response.data) {
        // Store tokens
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        
        // Store user data
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        return response.data;
      }
      throw new Error('Invalid response from server');
    } catch (error) {
      throw error;
    }
  },
  
  // Logout function
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },
  
  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return localStorage.getItem('access_token') !== null;
  },
  
  // Check if user has role "student"
  isStudent: () => {
    const user = authService.getCurrentUser();
    return user && user.role && user.role.toLowerCase() === 'student';
  },
  
  // Get token
  getToken: () => {
    return localStorage.getItem('access_token');
  },
  
  // Refresh token
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post('/refresh-token/', { refresh_token: refreshToken });
      
      if (response.data && response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        return response.data;
      }
      throw new Error('Invalid response from refresh token endpoint');
    } catch (error) {
      // If refresh token fails, log out the user
      authService.logout();
      throw error;
    }
  }
};

export default authService; 