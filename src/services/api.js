import axios from 'axios';
import authService from './auth';

// Create axios instance with base URL pointing to the Django backend
const api = axios.create({
  baseURL: 'http://localhost:8000', // Adjust this if your Django backend is hosted elsewhere
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 Unauthorized errors (token expired/invalid)
    if (error.response && error.response.status === 401) {
      // Try to refresh the token
      try {
        await authService.refreshToken();
        
        // Retry the original request with the new token
        const originalRequest = error.config;
        originalRequest.headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout and redirect to login page
        authService.logout();
      }
    }
    return Promise.reject(error);
  }
);

// API endpoints for various services
// Note: Authentication is now handled by the separate authService

// Dashboard services
export const dashboardService = {
  getDashboard: () => api.get('/api/dashboard/'),
  getNextLesson: () => api.get('/api/student/next-lesson/'),
  getPendingAssignments: () => api.get('/api/student/assignments/pending/'),
  getRecentNotes: () => api.get('/notes/'),
  getPerformance: () => api.get('/api/student/performance/'),
  getWeeklySnapshot: () => api.get('/api/student/weekly-snapshot/'),
};

// Lessons/Sessions services
export const lessonsService = {
  getLessons: () => api.get('/sessions/'),
  getLessonById: (id) => api.get(`/sessions/details/${id}/`),
  joinLesson: (id) => api.post(`/vidchat/join-session/${id}/`),
  getUpcomingLessons: () => api.get('/sessions/'), // Filter upcoming on frontend
  getStudentSessions: () => api.get('/sessions/'),
  getSessionNotes: (sessionId) => api.get(`/notes/session/${sessionId}/`),
  getTutorMeetingInfo: (tutorId) => api.get(`/tutor/meeting-info/${tutorId}/`),
  rateSession: (data) => api.post('/session-rating/', data),
};

// Assignments services
export const assignmentsService = {
  getAssignments: () => api.get('/api/assignments/'),
  getAssignmentById: (id) => api.get(`/api/assignments/${id}/`),
  submitAssignment: (id, data) => api.post(`/api/assignments/${id}/submissions/`, data),
  getSessionAssignments: (sessionId) => api.get(`/assignments/session/${sessionId}/`),
  getAssignmentStats: () => api.get('/api/assignments/stats/'),
};

// Notes services
export const notesService = {
  getNotes: () => api.get('/notes/'),
  getNotesByStudentId: (studentId) => api.get(`/notes/student/${studentId}/`),
  getNoteById: (id) => api.get(`/notes/${id}/`),
  downloadNote: (id) => api.get(`/notes/${id}/`, { responseType: 'blob' }),
  getSessionNotes: (sessionId) => api.get(`/notes/session/${sessionId}/`),
};

// Profile services
export const profileService = {
  getStudentProfile: () => api.get('/student-profile/'),
  getTutorProfile: () => api.get('/tutor-profile/'),
  updateStudentProfile: (data) => api.post('/student-profile/', data), // Using POST because the API supports it for updates
  updateUserInfo: (userId, data) => api.put(`/users/${userId}/`, data), // Changed from PATCH to PUT
  getTutorRecommendations: (topN = 5) => api.get(`/tutor-recommendations/?top_n=${topN}`),
  provideFeedback: (data) => api.post('/recommendation-feedback/', data),
};

// Progress services
export const progressService = {
  getStudentProgress: (studentId) => api.get(`/progress/student/${studentId}/`),
};

// Settings services
export const settingsService = {
  getStudentSettings: () => api.get('/api/student/settings/'),
  updateStudentSettings: (data) => api.patch('/api/student/settings/', data),
  changePassword: (data) => api.post('/api/student/change-password/', data),
  getNotificationPreferences: () => api.get('/api/student/preferences/'),
  updateNotificationPreferences: (data) => api.put('/api/student/preferences/', data),
  updateThemePreference: (theme) => api.put('/api/student/preferences/theme/', { theme }),
};

export default api; 