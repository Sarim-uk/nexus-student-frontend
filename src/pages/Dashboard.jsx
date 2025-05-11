import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { dashboardService } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';
import TutorRecommendationsSection from '../components/dashboard/TutorRecommendationsSection';
import PerformanceInsightsPanel from '../components/dashboard/PerformanceInsightsPanel';

// Initialize dayjs plugins
dayjs.extend(relativeTime);
dayjs.extend(calendar);

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

// Chart colors
const COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ef4444', '#f59e0b'];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextLesson, setNextLesson] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [weeklySnapshot, setWeeklySnapshot] = useState({ lessons: [], assignments: [] });
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [userData, setUserData] = useState(null);
  const [showFallbackUI, setShowFallbackUI] = useState(false);
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(true);
  const [isNextLessonLoading, setIsNextLessonLoading] = useState(true);
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [isPendingAssignmentsLoading, setIsPendingAssignmentsLoading] = useState(true);
  const [isRecentNotesLoading, setIsRecentNotesLoading] = useState(true);
  const [isWeeklySnapshotLoading, setIsWeeklySnapshotLoading] = useState(true);

  // Get user data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  // Fetch data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setIsPerformanceLoading(true);
      setIsNextLessonLoading(true);
      setIsPendingAssignmentsLoading(true);
      setIsRecentNotesLoading(true);
      setIsWeeklySnapshotLoading(true);

      // Set timeouts to ensure loading states eventually turn off
      const performanceTimeout = setTimeout(() => {
        if (isPerformanceLoading) {
          console.log("Performance loading timed out");
          setIsPerformanceLoading(false);
        }
      }, 8000);
      
      const nextLessonTimeout = setTimeout(() => {
        if (isNextLessonLoading) {
          console.log("Next lesson loading timed out");
          setIsNextLessonLoading(false);
        }
      }, 8000);
      
      const assignmentsTimeout = setTimeout(() => {
        if (isPendingAssignmentsLoading) {
          console.log("Assignments loading timed out");
          setIsPendingAssignmentsLoading(false);
        }
      }, 8000);
      
      const notesTimeout = setTimeout(() => {
        if (isRecentNotesLoading) {
          console.log("Notes loading timed out");
          setIsRecentNotesLoading(false);
        }
      }, 8000);
      
      const snapshotTimeout = setTimeout(() => {
        if (isWeeklySnapshotLoading) {
          console.log("Weekly snapshot loading timed out");
          setIsWeeklySnapshotLoading(false);
        }
      }, 8000);

      try {
        // Attempt to fetch all dashboard data in parallel
        const [
          nextLessonRes,
          assignmentsRes,
          notesRes,
          performanceRes,
          weeklySnapshotRes
        ] = await Promise.all([
          dashboardService.getNextLesson().catch(() => ({ data: null })),
          dashboardService.getPendingAssignments().catch(() => ({ data: [] })),
          dashboardService.getRecentNotes().catch(() => ({ data: [] })),
          dashboardService.getPerformance().catch(() => ({ data: [] })),
          dashboardService.getWeeklySnapshot().catch(() => ({ data: { lessons: [], assignments: [] } }))
        ]);

        // Process next lesson
        if (nextLessonRes.data) {
          const nextSessionData = nextLessonRes.data;
          const formattedLesson = {
            id: nextSessionData.id || nextSessionData.uuid,
            title: nextSessionData.subject || nextSessionData.title || "Untitled Session",
            teacher: nextSessionData.tutor_name || nextSessionData.teacher_name || "Instructor",
            startTime: nextSessionData.start_time || nextSessionData.startTime,
            date: dayjs(nextSessionData.start_time || nextSessionData.startTime).format("dddd, MMMM D, YYYY"),
            time: dayjs(nextSessionData.start_time || nextSessionData.startTime).format("h:mm A"),
            meeting_link: nextSessionData.meeting_link || nextSessionData.meetingLink
          };
          
          setNextLesson(formattedLesson);
          
          // Calculate time remaining for next lesson
          if (formattedLesson.startTime) {
            calculateTimeRemaining(new Date(formattedLesson.startTime));
          }
        } else {
          console.log("No next lesson data available");
          setNextLesson(null);
        }
        clearTimeout(nextLessonTimeout);
        setIsNextLessonLoading(false);
        
        // Process assignments
        if (assignmentsRes.data && Array.isArray(assignmentsRes.data) && assignmentsRes.data.length > 0) {
          const formattedAssignments = assignmentsRes.data.map(assignment => ({
            id: assignment.id,
            title: assignment.title,
            dueDate: assignment.due_date ? dayjs(assignment.due_date) : null,
            formattedDueDate: assignment.due_date ? dayjs(assignment.due_date).format("MMM D") : "No due date",
            subject: assignment.subject || "General",
            isUrgent: assignment.due_date ? dayjs(assignment.due_date).diff(dayjs(), 'day') <= 2 : false
          }));
          
          setAssignments(formattedAssignments);
          setPendingAssignments(formattedAssignments);
        } else {
          console.log("No assignments data available");
          setAssignments([]);
          setPendingAssignments([]);
        }
        clearTimeout(assignmentsTimeout);
        setIsPendingAssignmentsLoading(false);
        
        // Process notes
        if (notesRes.data && Array.isArray(notesRes.data) && notesRes.data.length > 0) {
          const formattedNotes = notesRes.data.map(note => ({
            id: note.id,
            title: note.title || "Untitled Note",
            description: note.description || note.content || "No description",
            date: note.created_at ? dayjs(note.created_at).format("MMM D") : "Unknown date",
            subject: note.subject || "General",
            fileUrl: note.file_url || note.file || note.notes_url || '',
            fileType: getFileType(note.file_url || note.file || note.notes_url || ''),
            uploadedBy: note.uploaded_by_name || "Teacher"
          }));
          
          setRecentNotes(formattedNotes);
        } else {
          console.log("No notes data available");
          setRecentNotes([]);
        }
        clearTimeout(notesTimeout);
        setIsRecentNotesLoading(false);
        
        // Process performance data
        if (performanceRes.data && Array.isArray(performanceRes.data) && performanceRes.data.length > 0) {
          setPerformanceData(performanceRes.data);
        } else {
          console.log("No performance data available");
          setPerformanceData([]);
        }
        clearTimeout(performanceTimeout);
        setIsPerformanceLoading(false);
        
        // Process weekly snapshot
        if (weeklySnapshotRes.data && 
            (Array.isArray(weeklySnapshotRes.data.lessons) || Array.isArray(weeklySnapshotRes.data.assignments)) &&
            (weeklySnapshotRes.data.lessons?.length > 0 || weeklySnapshotRes.data.assignments?.length > 0)) {
          setWeeklySnapshot(weeklySnapshotRes.data);
        } else {
          console.log("No weekly snapshot data available");
          setWeeklySnapshot({ lessons: [], assignments: [] });
        }
        clearTimeout(snapshotTimeout);
        setIsWeeklySnapshotLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        
        // Clear all timeouts and set loading states to false
        clearTimeout(performanceTimeout);
        clearTimeout(nextLessonTimeout);
        clearTimeout(assignmentsTimeout);
        clearTimeout(notesTimeout);
        clearTimeout(snapshotTimeout);
        
        // Set all data to empty values instead of using mock data
        setPerformanceData([]);
        setNextLesson(null);
        setAssignments([]);
        setPendingAssignments([]);
        setRecentNotes([]);
        setWeeklySnapshot({ lessons: [], assignments: [] });
        
        setIsPerformanceLoading(false);
        setIsNextLessonLoading(false);
        setIsPendingAssignmentsLoading(false);
        setIsRecentNotesLoading(false);
        setIsWeeklySnapshotLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Clear timeouts on component unmount
    return () => {
      setIsPerformanceLoading(false);
      setIsNextLessonLoading(false);
      setIsPendingAssignmentsLoading(false);
      setIsRecentNotesLoading(false);
      setIsWeeklySnapshotLoading(false);
    };
  }, [userData]);

  // Get file type from URL or filename
  const getFileType = (fileUrl) => {
    if (!fileUrl) return 'default';
    
    // Try to extract the extension
    let extension;
    
    // Handle different URL formats
    if (fileUrl.includes('?')) {
      // If URL has query parameters, get the path part
      const pathPart = fileUrl.split('?')[0];
      extension = pathPart.split('.').pop().toLowerCase();
    } else if (fileUrl.includes('/')) {
      // If it's a path, extract the filename and then the extension
      const fileName = fileUrl.split('/').pop();
      extension = fileName.split('.').pop().toLowerCase();
    } else {
      // Simple file name
      extension = fileUrl.split('.').pop().toLowerCase();
    }
    
    // Check for known extensions
    if (['pdf'].includes(extension)) return 'pdf';
    if (['doc', 'docx'].includes(extension)) return 'docx';
    if (['xls', 'xlsx', 'csv'].includes(extension)) return 'xlsx';
    if (['jpg', 'jpeg'].includes(extension)) return 'jpg';
    if (['png'].includes(extension)) return 'png';
    
    return 'default';
  };

  // Calculate time remaining for next lesson
  const calculateTimeRemaining = (startTime) => {
    const updateCounter = () => {
      const now = new Date();
      const diff = startTime - now;
      
      if (diff <= 0) {
        // Lesson has started
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining({
        hours,
        minutes,
        seconds
      });
    };
    
    // Update immediately then every second
    updateCounter();
    const interval = setInterval(updateCounter, 1000);
    
    // Cleanup on unmount
    return () => clearInterval(interval);
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return dayjs(timeString).format('h:mm A');
  };

  // Format date relative to today
  const formatRelativeDate = (dateString) => {
    if (!dateString) return 'N/A';
    return dayjs(dateString).calendar(null, {
      sameDay: '[Today]',
      nextDay: '[Tomorrow]',
      nextWeek: 'dddd',
      lastDay: '[Yesterday]',
      lastWeek: '[Last] dddd',
      sameElse: 'MM/DD/YYYY'
    });
  };

  // Calculate days until due
  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const due = dayjs(dueDate);
    const now = dayjs();
    const days = due.diff(now, 'day');
    
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  // Get status color for assignments
  const getStatusColor = (dueDate) => {
    if (!dueDate) return 'gray';
    
    const due = dayjs(dueDate);
    const now = dayjs();
    const days = due.diff(now, 'day');
    
    if (days < 0) return 'text-red-500';
    if (days === 0) return 'text-orange-500';
    if (days <= 2) return 'text-amber-500';
    return 'text-blue-500';
  };

  // Sort assignments by due date
  const sortedAssignments = [...assignments].sort((a, b) => {
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  // Performance Data Fallback UI
  const PerformanceDataFallbackUI = () => (
    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
      <div className="flex justify-center items-center mb-4">
        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data Available</h3>
      <p className="text-gray-600 mb-4">Your performance data couldn't be loaded. This could be because you haven't completed any assignments yet or there was an issue retrieving your data.</p>
      <button 
        onClick={() => window.location.reload()} 
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
      >
        Refresh Dashboard
      </button>
    </div>
  );

  // Next Lesson Fallback UI
  const NextLessonFallbackUI = () => (
    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
      <div className="flex justify-center items-center mb-4">
        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Lessons</h3>
      <p className="text-gray-600 mb-4">You don't have any scheduled lessons. Check back later or book a session with a tutor.</p>
      <a 
        href="/lessons" 
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm inline-block"
      >
        Browse Available Lessons
      </a>
    </div>
  );

  // Weekly Snapshot Fallback UI
  const WeeklySnapshotFallbackUI = () => (
    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center h-full">
      <div className="flex justify-center items-center mb-4">
        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Weekly Schedule Data</h3>
      <p className="text-gray-600 mb-4">We couldn't find any scheduled lessons or assignments for this week in your schedule. Try booking a session or checking again later.</p>
      <button 
        onClick={() => window.location.href = '/lessons'}  
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
      >
        Book a Session
      </button>
    </div>
  );

  // Compute assignment urgency styles
  const getAssignmentUrgencyStyle = (assignment) => {
    if (!assignment.dueDate) return 'bg-gray-100 text-gray-700';
    if (assignment.isUrgent) return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !showFallbackUI) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* First column - Performance chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="bg-white shadow-card rounded-xl mb-6 border border-gray-100 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Weekly Performance</h2>
              
              {isPerformanceLoading ? (
                <div className="py-10 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : performanceData && performanceData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 0, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="assignment_name" 
                        tick={{ fontSize: 12 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value, name) => [`${value}%`, 'Score']}
                        labelFormatter={(label) => `Assignment: ${label}`}
                      />
                      <Bar 
                        dataKey="score" 
                        name="Score" 
                        radius={[4, 4, 0, 0]}
                      >
                        {performanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <PerformanceDataFallbackUI />
              )}
            </div>
          </div>
          
          {/* Performance Insights Panel */}
          <motion.div variants={itemVariants}>
            <PerformanceInsightsPanel />
          </motion.div>
        </motion.div>

        {/* Second column - Next lesson and weekly snapshot */}
        <motion.div variants={itemVariants} className="flex flex-col space-y-6">
          {/* Next lesson */}
          <div className="bg-white shadow-card rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Next Lesson</h2>
                <a href="/lessons" className="text-sm text-primary hover:text-primary-dark transition-colors font-medium">
                  View all
                </a>
              </div>
              
              {isNextLessonLoading ? (
                <div className="py-6 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : nextLesson ? (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">
                        {formatRelativeDate(nextLesson.scheduled_time || nextLesson.startTime)}
                      </span>
                      <span className="text-sm font-medium text-primary">
                        {formatTime(nextLesson.scheduled_time || nextLesson.startTime)}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-semibold mt-1 text-gray-800">
                      {nextLesson.subject || nextLesson.title || 'Tutoring Session'}
                    </h3>
                    
                    <div className="mt-3 flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span>
                        {nextLesson.tutor_name || nextLesson.teacher || 'Assigned Tutor'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4">
                    <a 
                      href={`/lessons/${nextLesson.id || 'upcoming'}`} 
                      className="w-full py-2 flex items-center justify-center bg-primary text-white hover:bg-primary-dark transition-colors rounded-lg text-sm font-medium"
                    >
                      <span>View Details</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  </div>
                </div>
              ) : (
                <NextLessonFallbackUI />
              )}
            </div>
          </div>
          
          {/* Weekly snapshot */}
          <div className="bg-white shadow-card rounded-xl border border-gray-100 overflow-hidden flex-grow">
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Weekly Snapshot</h2>
                <a href="/lessons" className="text-sm text-primary hover:text-primary-dark transition-colors font-medium">
                  View all lessons
                </a>
              </div>
              
              {isWeeklySnapshotLoading ? (
                <div className="py-6 flex justify-center flex-grow">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : weeklySnapshot && 
                  ((Array.isArray(weeklySnapshot.lessons) && weeklySnapshot.lessons.length > 0) || 
                   (Array.isArray(weeklySnapshot.assignments) && weeklySnapshot.assignments.length > 0)) ? (
                <div className="flex flex-col h-full">
                  {/* Lessons */}
                  {weeklySnapshot.lessons && Array.isArray(weeklySnapshot.lessons) && weeklySnapshot.lessons.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm uppercase text-gray-500 font-medium mb-2">Upcoming Sessions</h3>
                      <div className="space-y-2">
                        {weeklySnapshot.lessons.slice(0, 3).map((lesson, index) => (
                          <div key={lesson.id || index} className="p-3 bg-blue-50 rounded-lg flex justify-between items-center">
                            <div>
                              <div className="font-medium text-gray-800">{lesson.subject}</div>
                              <div className="text-sm text-gray-600">{lesson.day} at {lesson.time}</div>
                            </div>
                            <div className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                              {(lesson.tutor && typeof lesson.tutor === 'string') 
                                ? lesson.tutor.split(' ')[0] 
                                : (lesson.tutor_name && typeof lesson.tutor_name === 'string')
                                  ? lesson.tutor_name.split(' ')[0]
                                  : 'Tutor'}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-center">
                        <a 
                          href="/lessons" 
                          className="text-sm font-medium text-primary hover:text-primary-dark transition-colors inline-flex items-center"
                        >
                          <span>View all sessions</span>
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Assignments */}
                  {weeklySnapshot.assignments && Array.isArray(weeklySnapshot.assignments) && weeklySnapshot.assignments.length > 0 && (
                    <div>
                      <h3 className="text-sm uppercase text-gray-500 font-medium mb-2">Upcoming Assignments</h3>
                      <div className="space-y-2">
                        {weeklySnapshot.assignments.slice(0, 3).map((assignment, index) => (
                          <div key={assignment.id || index} className="p-3 bg-amber-50 rounded-lg flex justify-between items-center">
                            <div>
                              <div className="font-medium text-gray-800">{assignment.title}</div>
                              <div className="text-sm text-gray-600">Due {assignment.dueDay}</div>
                            </div>
                            <div className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                              {assignment.subject}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-center">
                        <a 
                          href="/assignments" 
                          className="text-sm font-medium text-primary hover:text-primary-dark transition-colors inline-flex items-center"
                        >
                          <span>View all assignments</span>
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <WeeklySnapshotFallbackUI />
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Tutor Recommendations (Full width at the bottom) */}
      <motion.div 
        variants={itemVariants}
        className="mt-6"
      >
        <TutorRecommendationsSection />
      </motion.div>
    </div>
  );
};

export default Dashboard; 