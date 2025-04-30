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

// Mock data for development
const mockPerformanceData = [
  { assignment_name: 'Math Quiz 1', score: 85, max_score: 100 },
  { assignment_name: 'History Essay', score: 92, max_score: 100 },
  { assignment_name: 'Physics Lab', score: 78, max_score: 100 },
  { assignment_name: 'English Project', score: 88, max_score: 100 },
  { assignment_name: 'Chemistry Test', score: 95, max_score: 100 },
  { assignment_name: 'Biology Report', score: 90, max_score: 100 },
];

const mockWeeklySnapshot = {
  lessons: [
    { id: 1, day: 'Monday', subject: 'Mathematics', time: '10:00 AM' },
    { id: 2, day: 'Wednesday', subject: 'Physics', time: '2:00 PM' },
    { id: 3, day: 'Friday', subject: 'English', time: '11:30 AM' }
  ],
  assignments: [
    { id: 1, title: 'Math Problem Set', dueDay: 'Tuesday', subject: 'Mathematics' },
    { id: 2, title: 'Physics Lab Report', dueDay: 'Thursday', subject: 'Physics' }
  ]
};

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
        }
        
        // Process assignments
        if (assignmentsRes.data && assignmentsRes.data.length > 0) {
          const formattedAssignments = assignmentsRes.data.map(assignment => ({
            id: assignment.id,
            title: assignment.title,
            dueDate: assignment.due_date ? dayjs(assignment.due_date) : null,
            formattedDueDate: assignment.due_date ? dayjs(assignment.due_date).format("MMM D") : "No due date",
            subject: assignment.subject || "General",
            isUrgent: assignment.due_date ? dayjs(assignment.due_date).diff(dayjs(), 'day') <= 2 : false
          }));
          
          setAssignments(formattedAssignments);
        } else {
          console.log("No assignments data available");
        }
        
        // Process notes
        if (notesRes.data && notesRes.data.length > 0) {
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
        }
        
        // Process performance data
        if (performanceRes.data && performanceRes.data.length > 0) {
          setPerformanceData(performanceRes.data);
        } else {
          console.log("No performance data available");
          // Use mock data for development
          setPerformanceData(mockPerformanceData);
        }
        
        // Process weekly snapshot
        if (weeklySnapshotRes.data && 
            (weeklySnapshotRes.data.lessons?.length > 0 || weeklySnapshotRes.data.assignments?.length > 0)) {
          setWeeklySnapshot(weeklySnapshotRes.data);
        } else {
          console.log("No weekly snapshot data available");
          // Use mock data for development
          setWeeklySnapshot(mockWeeklySnapshot);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        
        // For development/error fallback, set mock data
        setPerformanceData(mockPerformanceData);
        setWeeklySnapshot(mockWeeklySnapshot);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
      
      setTimeRemaining({ hours, minutes, seconds });
    };
    
    // Update immediately
    updateCounter();
    
    // Then update every second
    const interval = setInterval(updateCounter, 1000);
    
    return () => clearInterval(interval);
  };

  // Get assignment urgency styling
  const getAssignmentUrgencyStyle = (assignment) => {
    if (!assignment.dueDate) return "border-gray-200";
    
    const daysUntilDue = assignment.dueDate.diff(dayjs(), 'day');
    
    if (daysUntilDue < 0) return "border-red-400 bg-red-50";
    if (daysUntilDue <= 2) return "border-yellow-400 bg-yellow-50";
    return "border-gray-200";
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 
        className="text-3xl font-bold mb-6"
        variants={itemVariants}
      >
        Your Dashboard
      </motion.h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Next Lesson Card */}
      <motion.div 
          className="col-span-1 md:col-span-2 lg:col-span-2"
        variants={itemVariants}
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-2">📅</span>
              Next Lesson
            </h2>
            
            {nextLesson ? (
          <div>
                <h3 className="text-lg font-semibold text-gray-800">{nextLesson.title}</h3>
                <div className="mb-2 text-gray-700">with {nextLesson.teacher}</div>
                <div className="flex items-center mb-4 text-gray-700">
                  <svg className="w-4 h-4 mr-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  {nextLesson.date} at {nextLesson.time}
          </div>
          
                <div className="mb-2 text-gray-700 font-medium">Starting in:</div>
                <div className="flex space-x-1 mb-4">
                  <div className="bg-primary/10 rounded px-3 py-2 text-center">
                    <div className="text-xl font-mono font-semibold text-primary">{String(timeRemaining.hours).padStart(2, '0')}</div>
                    <div className="text-xs text-gray-500">Hours</div>
                  </div>
                  <div className="bg-primary/10 rounded px-3 py-2 text-center">
                    <div className="text-xl font-mono font-semibold text-primary">{String(timeRemaining.minutes).padStart(2, '0')}</div>
                    <div className="text-xs text-gray-500">Minutes</div>
            </div>
                  <div className="bg-primary/10 rounded px-3 py-2 text-center">
                    <div className="text-xl font-mono font-semibold text-primary">{String(timeRemaining.seconds).padStart(2, '0')}</div>
                    <div className="text-xs text-gray-500">Seconds</div>
          </div>
        </div>
        
        <motion.button 
                  className={`flex items-center justify-center px-6 py-2 rounded ${
                    timeRemaining.hours === 0 && timeRemaining.minutes <= 15 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  } transition`}
                  whileHover={timeRemaining.hours === 0 && timeRemaining.minutes <= 15 ? { scale: 1.03 } : {}}
                  whileTap={timeRemaining.hours === 0 && timeRemaining.minutes <= 15 ? { scale: 0.97 } : {}}
                  onClick={() => {
                    if (timeRemaining.hours === 0 && timeRemaining.minutes <= 15 && nextLesson.meeting_link) {
                      window.open(nextLesson.meeting_link, '_blank');
                    } else if (timeRemaining.hours === 0 && timeRemaining.minutes <= 15) {
                      alert('Meeting link not available yet');
                    }
                  }}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  {timeRemaining.hours === 0 && timeRemaining.minutes <= 15 ? 'Join Now' : 'Join (Available 15 min before)'}
        </motion.button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mb-2 text-lg font-medium">No upcoming lessons</p>
                <p>You have no upcoming lessons. Enjoy your free time!</p>
              </div>
            )}
          </div>
      </motion.div>
        
        {/* Pending Assignments Card */}
        <motion.div variants={itemVariants} className="col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
            <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2">✅</span>
                Pending Assignments
              </div>
              {assignments.length > 0 && (
                <span className="bg-primary text-white text-xs rounded-full px-2 py-1">
                  {assignments.length}
                </span>
              )}
            </h2>
            
            {assignments.length > 0 ? (
              <div className="space-y-3">
                {assignments.slice(0, 3).map((assignment) => (
                  <div 
                    key={assignment.id}
                    className={`border rounded-md p-3 transition-all ${getAssignmentUrgencyStyle(assignment)}`}
                  >
                    <div className="flex justify-between">
                      <h3 className="font-medium text-gray-800">{assignment.title}</h3>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        assignment.isUrgent ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {assignment.formattedDueDate}
                      </span>
                    </div>
                    {assignment.subject && (
                      <p className="text-sm text-gray-600 mt-1">{assignment.subject}</p>
                    )}
                    <div className="mt-2">
                      <motion.a
                        href={`/assignments/${assignment.id}`}
                        className="text-sm text-primary hover:text-primary-dark flex items-center"
                        whileHover={{ x: 2 }}
                      >
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        Submit Assignment
                      </motion.a>
                    </div>
                  </div>
                ))}
                
                {assignments.length > 3 && (
                  <motion.a
                    href="/assignments"
                    className="block text-center text-sm text-primary hover:text-primary-dark mt-3"
                    whileHover={{ y: -2 }}
                  >
                    View all {assignments.length} assignments
                  </motion.a>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="mb-2 text-lg font-medium">All caught up!</p>
                <p>You have no pending assignments. Great job!</p>
              </div>
            )}
              </div>
            </motion.div>
        
        {/* Performance Overview Chart */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Performance Overview
            </h2>
            
            {performanceData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={performanceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="assignment_name"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, 'Score']}
                      labelFormatter={(value) => `Assignment: ${value}`}
                    />
                    <Bar 
                      dataKey="score" 
                      name="Score" 
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      barSize={30}
                    >
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mb-2 text-lg font-medium">No performance data yet</p>
                <p>Start submitting assignments to track your progress here.</p>
              </div>
            )}
          </div>
      </motion.div>
      
      {/* Recent Notes Card */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-2">📘</span>
              Recently Shared Notes
            </h2>
            
            {recentNotes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentNotes.slice(0, 4).map((note) => (
                  <div 
                    key={note.id}
                    className="border border-gray-200 rounded-md p-3 flex"
                  >
                    <div className="mr-3 flex-shrink-0">
                      {note.fileType === 'pdf' && (
                        <div className="w-10 h-12 bg-red-100 flex items-center justify-center rounded">
                          <span className="text-red-700 text-xs font-bold">PDF</span>
                        </div>
                      )}
                      {note.fileType === 'docx' && (
                        <div className="w-10 h-12 bg-blue-100 flex items-center justify-center rounded">
                          <span className="text-blue-700 text-xs font-bold">DOC</span>
                        </div>
                      )}
                      {note.fileType === 'xlsx' && (
                        <div className="w-10 h-12 bg-green-100 flex items-center justify-center rounded">
                          <span className="text-green-700 text-xs font-bold">XLS</span>
                        </div>
                      )}
                      {(note.fileType === 'jpg' || note.fileType === 'png') && (
                        <div className="w-10 h-12 bg-purple-100 flex items-center justify-center rounded">
                          <span className="text-purple-700 text-xs font-bold">IMG</span>
                        </div>
                      )}
                      {note.fileType === 'default' && (
                        <div className="w-10 h-12 bg-gray-100 flex items-center justify-center rounded">
                          <span className="text-gray-700 text-xs font-bold">FILE</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium text-gray-800 text-sm line-clamp-1">{note.title}</h3>
                      <p className="text-xs text-gray-600">{note.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">{note.date}</p>
                      
                      <motion.a
                        href={`/notes`}
                        className="text-xs text-primary hover:text-primary-dark flex items-center mt-1"
                        whileHover={{ x: 2 }}
                      >
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        View
                      </motion.a>
                    </div>
                  </div>
                ))}
                
                {recentNotes.length > 4 && (
                  <motion.a
                    href="/notes"
                    className="block text-center text-sm text-primary hover:text-primary-dark mt-3 col-span-1 md:col-span-2"
                    whileHover={{ y: -2 }}
                  >
                    View all notes
                  </motion.a>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mb-2 text-lg font-medium">No notes shared yet</p>
                <p>Check back later for new notes from your tutors.</p>
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Weekly Snapshot Card */}
        <motion.div variants={itemVariants} className="col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-2">📆</span>
              This Week at a Glance
            </h2>
            
            {(weeklySnapshot.lessons.length > 0 || weeklySnapshot.assignments.length > 0) ? (
              <div>
                {weeklySnapshot.lessons.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-700 mb-2">Upcoming Lessons</h3>
                    <ul className="space-y-2">
                      {weeklySnapshot.lessons.map((lesson) => (
                        <li key={lesson.id} className="flex items-start">
                          <div className="w-20 flex-shrink-0 font-medium text-gray-500">{lesson.day}</div>
                          <div>
                            <div className="font-medium text-gray-800">{lesson.subject}</div>
                            <div className="text-sm text-gray-500">{lesson.time}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {weeklySnapshot.assignments.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Due This Week</h3>
                    <ul className="space-y-2">
                      {weeklySnapshot.assignments.map((assignment) => (
                        <li key={assignment.id} className="flex items-start">
                          <div className="w-20 flex-shrink-0 font-medium text-gray-500">{assignment.dueDay}</div>
                          <div>
                            <div className="font-medium text-gray-800">{assignment.title}</div>
                            <div className="text-sm text-gray-500">{assignment.subject}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mb-2 text-lg font-medium">Your week is clear</p>
                <p>Nothing scheduled for this week.</p>
              </div>
            )}
              </div>
            </motion.div>
            
            {/* Tutor Recommendations Section */}
            <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 lg:col-span-3">
              <TutorRecommendationsSection />
            </motion.div>
        </div>
    </motion.div>
  );
};

export default Dashboard; 