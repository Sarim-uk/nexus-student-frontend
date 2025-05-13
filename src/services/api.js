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
  getNextLesson: () => api.get('/sessions/')
    .then(res => {
      // Get the next upcoming session from the sessions list
      if (res.data && Array.isArray(res.data)) {
        const now = new Date();
        const upcoming = res.data
          .filter(session => new Date(session.scheduled_time || session.startTime) > now)
          .sort((a, b) => new Date(a.scheduled_time || a.startTime) - new Date(b.scheduled_time || b.startTime));
        return { data: upcoming[0] || null };
      }
      return { data: null };
    })
    .catch(err => {
      console.error('Error fetching next lesson:', err);
      // Return null data instead of rejecting
      return { data: null };
    }),
  getPendingAssignments: () => api.get('/api/assignments/')
    .then(res => {
      // Filter to only return pending assignments
      if (res.data && Array.isArray(res.data)) {
        const pendingAssignments = res.data.filter(assignment => 
          !assignment.is_completed && assignment.due_date && new Date(assignment.due_date) > new Date()
        );
        return { data: pendingAssignments };
      }
      return { data: [] };
    })
    .catch(err => {
      console.error('Error fetching pending assignments:', err);
      // Return empty array instead of rejecting
      return { data: [] };
    }),
  getRecentNotes: () => api.get('/notes/')
    .catch(err => {
      console.error('Error fetching notes:', err);
      // Return empty array instead of rejecting
      return { data: [] };
    }),
  getPerformance: () => api.get('/student/performance/')
    .then(res => {
      // Extract and format performance data
      if (res.data && res.data.assignments) {
        // Convert the assignment data to the format expected by the chart
        const chartData = res.data.assignments
          .filter(assignment => assignment.status === 'Completed') // Only show completed assignments
          .map(assignment => ({
            assignment_name: assignment.title,
            score: assignment.percentage || 0,
            max_score: 100,
            subject: assignment.subject || 'General'
          }));
        return { data: chartData };
      }
      
      // If no student performance data, try dashboard API as fallback
      return api.get('/api/dashboard/')
        .then(dashRes => {
          return { data: dashRes.data?.performance_data || [] };
        })
        .catch(() => {
          // If both endpoints fail, return empty array
          return { data: [] };
        });
    })
    .catch(() => {
      // Return empty array instead of rejecting
      return { data: [] };
    }),
  getWeeklySnapshot: () => api.get('/api/dashboard/')
    .then(res => {
      // Extract weekly snapshot from dashboard response
      if (res.data?.weekly_snapshot) {
        return { data: res.data.weekly_snapshot };
      }
      
      // Try extracting from sessions and assignments as a fallback
      const createWeeklySnapshot = async () => {
        try {
          // Get upcoming sessions
          const sessionsResponse = await api.get('/sessions/');
          const assignmentsResponse = await api.get('/api/assignments/');
          
          const now = new Date();
          const oneWeekFromNow = new Date(now);
          oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
          
          // Format sessions for weekly snapshot
          const upcomingSessions = sessionsResponse.data && Array.isArray(sessionsResponse.data) 
            ? sessionsResponse.data
                .filter(session => {
                  const sessionDate = new Date(session.scheduled_time || session.start_time || session.startTime);
                  return sessionDate > now && sessionDate < oneWeekFromNow;
                })
                .map(session => {
                  const sessionDate = new Date(session.scheduled_time || session.start_time || session.startTime);
                  return {
                    id: session.id,
                    day: sessionDate.toLocaleDateString('en-US', { weekday: 'long' }),
                    subject: session.subject || session.title || 'Tutoring Session',
                    time: sessionDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                    tutor: session.tutor_name || session.teacher_name || 'Assigned Tutor'
                  };
                })
                .sort((a, b) => {
                  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  return daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day);
                })
            : [];
            
          // Format assignments for weekly snapshot
          const upcomingAssignments = assignmentsResponse.data && Array.isArray(assignmentsResponse.data)
            ? assignmentsResponse.data
                .filter(assignment => {
                  if (!assignment.due_date) return false;
                  const dueDate = new Date(assignment.due_date);
                  return dueDate > now && dueDate < oneWeekFromNow;
                })
                .map(assignment => {
                  const dueDate = new Date(assignment.due_date);
                  return {
                    id: assignment.id,
                    title: assignment.title || 'Unnamed Assignment',
                    dueDay: dueDate.toLocaleDateString('en-US', { weekday: 'long' }),
                    subject: assignment.subject || 'General'
                  };
                })
                .sort((a, b) => {
                  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  return daysOfWeek.indexOf(a.dueDay) - daysOfWeek.indexOf(b.dueDay);
                })
            : [];
            
          return {
            lessons: upcomingSessions,
            assignments: upcomingAssignments
          };
        } catch (error) {
          console.error("Error creating weekly snapshot:", error);
          return { lessons: [], assignments: [] };
        }
      };
      
      return createWeeklySnapshot()
        .then(snapshot => {
          if (snapshot) {
            return { data: snapshot };
          }
          
          // If creating the snapshot fails, return empty object
          return { data: { lessons: [], assignments: [] } };
        });
    })
    .catch(err => {
      console.error('Error fetching weekly snapshot:', err);
      // Return empty data instead of mock data
      return { data: { lessons: [], assignments: [] } };
    }),
  // Get detailed performance data including progress trends and recommendations
  getDetailedPerformance: () => api.get('/student/performance/')
    .catch(err => {
      console.error('Error fetching detailed performance:', err);
      // Return empty object instead of mock data
      return { data: { strengths_weaknesses: { strengths: [], weaknesses: [] }, recommendations: [] } };
    }),
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
  getSessionAssignments: (sessionId) => api.get(`/api/assignments/session/${sessionId}/`),
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
  getTutorDetails: (tutorId) => api.get(`/tutors/${tutorId}/`),
  getTutorById: (tutorId) => api.get(`/users/${tutorId}/`),
};

// Progress services
export const progressService = {
  getStudentProgress: (studentId) => api.get(`/progress/student/${studentId}/`),
};

// Settings services
export const settingsService = {
  getStudentSettings: () => api.get('/student/settings/'),
  updateStudentSettings: (data) => api.patch('/student/settings/', data),
  changePassword: (data) => api.post('/student/change-password/', data),
  getNotificationPreferences: () => api.get('/student/preferences/'),
  updateNotificationPreferences: (data) => api.put('/student/preferences/', data),
  updateThemePreference: (theme) => api.put('/student/preferences/theme/', { theme }),
};

export default api; 