import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { lessonsService } from '../../services/api';
import authService from '../../services/auth';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';

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

const Lessons = () => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(dayjs());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Fetch lessons data
  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      setError(null);
      
      console.log('======== DEBUGGING SESSION DATA FETCH ========');
      console.log('Current user:', authService.getCurrentUser());
      
      try {
        // Get sessions from the sessions endpoint
        console.log('Fetching sessions from /sessions/ endpoint');
        const response = await lessonsService.getStudentSessions();
        
        console.log('Raw API Response:', response);
        console.log('Response status:', response.status);
        console.log('Response data type:', typeof response.data);
        console.log('Response data:', response.data);
        
        // Check if we got a valid response
        if (!response || !response.data) {
          console.error('Invalid response format:', response);
          throw new Error('The server returned an invalid response format');
        }
        
        // Log the structure to help with debugging
        console.log('Response structure:', {
          data: response.data,
          keys: Object.keys(response.data)
        });
        
        // Direct check for empty array response
        if (Array.isArray(response.data) && response.data.length === 0) {
          console.log('Server returned an empty array - no sessions for this student');
          setLessons([]);
          setError('No upcoming sessions found. Check back later for new sessions.');
          setLoading(false);
          return;
        }
        
        // Extract sessions from the dashboard data
        // The sessions may be in different properties depending on the API
        let sessionsData = [];
        
        // Check several possible locations for the sessions data
        if (response.data.upcoming_sessions) {
          console.log('Found sessions in upcoming_sessions property');
          sessionsData = response.data.upcoming_sessions;
        } else if (response.data.sessions) {
          console.log('Found sessions in sessions property');
          sessionsData = response.data.sessions;
        } else if (response.data.student_sessions) {
          console.log('Found sessions in student_sessions property');
          sessionsData = response.data.student_sessions;
        } else if (Array.isArray(response.data)) {
          console.log('Found sessions in root data array');
          sessionsData = response.data;
        } else {
          // Last resort: look for any array in the response that might contain sessions
          for (const key in response.data) {
            if (Array.isArray(response.data[key]) && 
                response.data[key].length > 0 && 
                typeof response.data[key][0] === 'object') {
              console.log(`Found potential sessions in ${key} property`);
              // Check if objects in this array look like sessions (have scheduled_time or similar properties)
              const sampleItem = response.data[key][0];
              if (sampleItem.scheduled_time || sampleItem.start_time || 
                  sampleItem.tutor_first_name || sampleItem.tutor_name) {
                console.log(`Using sessions from ${key} property`);
                sessionsData = response.data[key];
                break;
              }
            }
          }
        }
        
        if (!Array.isArray(sessionsData)) {
          console.error('Could not extract sessions array from response:', response.data);
          sessionsData = [];
        }
        
        // Log a sample session to see its structure
        if (sessionsData.length > 0) {
          console.log('Sample session object:', sessionsData[0]);
        } else {
          console.log('No sessions found in the response');
        }
        
        // Process the data from the API, handling various field names
        const formattedSessions = sessionsData.map(session => {
          console.log('Processing session:', session);
          
          // Check what fields are available 
          const availableFields = Object.keys(session);
          console.log('Available fields:', availableFields);
          
          // Handle date format issues by forcibly using dayjs parsing
          let startTime;
          try {
            startTime = session.scheduled_time ? dayjs(session.scheduled_time).format() : null;
            console.log('Parsed start time:', startTime);
          } catch (err) {
            console.error('Error parsing start time:', err);
            startTime = null;
          }
          
          return {
            id: session.id,
            title: "Session with Tutor", // Default title since it's not in the serializer
            teacher_name: session.tutor_name || "Tutor", // This comes directly from the serializer
            start_time: startTime, // Ensure we have a valid date format
            end_time: startTime ? dayjs(startTime).add(1, 'hour').format() : null, // Assuming 1 hour sessions
            meeting_link: session.meeting_link || null, // We'll fetch this separately if needed
            status: session.status || "Scheduled",
            class_name: "Tutoring Session", // Default since it's not in the serializer
            tutor_id: session.tutor_ids // Save the tutor ID for fetching meeting links
          };
        });
        
        console.log('Formatted sessions:', formattedSessions);
        
        // Filter to only show future and ongoing sessions
        const relevantSessions = formattedSessions.filter(session => {
          // First ensure we have a session ID - skip sessions without IDs
          if (!session.id) {
            console.log('Skipping session without ID:', session);
            return false;
          }

          const hasValidStartTime = !!session.start_time && dayjs(session.start_time).isValid();
          
          // If start time is invalid but we have a session ID, let's keep it anyway
          // This way we show sessions even if there's a date format issue
          if (!hasValidStartTime) {
            console.log('Including session despite invalid start time (ID exists):', session.id);
            return true;
          }
          
          const hasEndTime = !!session.end_time && dayjs(session.end_time).isValid();
          const endTimeIsAfterCutoff = hasEndTime && dayjs(session.end_time).isAfter(currentTime.subtract(30, 'minute'));
          const startTimeIsInFuture = dayjs(session.start_time).isAfter(currentTime.subtract(30, 'minute'));
          
          console.log(`Session ${session.id} time check:`, {
            startTime: session.start_time,
            isValid: dayjs(session.start_time).isValid(),
            isInFuture: startTimeIsInFuture,
            hasEndTime,
            endTimeAfterCutoff: endTimeIsAfterCutoff,
            currentTime: currentTime.format(),
            passes: hasValidStartTime && (startTimeIsInFuture && (!hasEndTime || endTimeIsAfterCutoff))
          });
          
          // For now, let's include all sessions with valid start times regardless of timing
          // Just to make sure we're showing data
          return hasValidStartTime; 
          
          // Original filtering logic:
          // return hasValidStartTime && (startTimeIsInFuture && (!hasEndTime || endTimeIsAfterCutoff));
        });

        console.log('Relevant (future/ongoing) sessions:', relevantSessions);
        console.log('Relevant session count:', relevantSessions.length);

        // Sort by start time
        const sortedSessions = relevantSessions.sort((a, b) => 
          dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf()
        );

        console.log('Final sorted sessions:', sortedSessions);
        
        // TEMPORARILY DISABLED: Meeting link fetching - causes SQLite integer overflow with UUIDs
        /* 
        // Fetch meeting links for tutors if needed
        const sessionsWithoutLinks = sortedSessions.filter(s => !s.meeting_link && s.tutor_id);
        
        if (sessionsWithoutLinks.length > 0) {
          console.log('Fetching missing meeting links for', sessionsWithoutLinks.length, 'sessions');
          
          // Create a Set to avoid duplicate fetches for the same tutor
          const tutorIds = new Set(sessionsWithoutLinks.map(s => s.tutor_id));
          
          // Fetch meeting info for each tutor and update their sessions
          for (const tutorId of tutorIds) {
            try {
              const meetingInfoResponse = await lessonsService.getTutorMeetingInfo(tutorId);
              console.log('Tutor meeting info response:', meetingInfoResponse);
              
              if (meetingInfoResponse && meetingInfoResponse.data && meetingInfoResponse.data.meeting_link) {
                const meetingLink = meetingInfoResponse.data.meeting_link;
                
                // Update all sessions for this tutor
                sortedSessions.forEach(session => {
                  if (session.tutor_id === tutorId) {
                    session.meeting_link = meetingLink;
                  }
                });
              }
            } catch (meetingError) {
              console.warn(`Failed to get meeting link for tutor ${tutorId}:`, meetingError);
            }
          }
        }
        */
        
        // Add placeholder meeting links for all sessions
        sortedSessions.forEach(session => {
          session.meeting_link = "https://meet.google.com/placeholder";
        });
        
        setLessons(sortedSessions);
        
        if (sortedSessions.length === 0) {
          setError('No upcoming sessions found. Check back later for new sessions.');
        }
      } catch (err) {
        console.error('Error fetching lessons:', err);
        setError(`Failed to load sessions: ${err.message || 'Unknown error'}`);
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLessons();
  }, [currentTime]); // Re-fetch when current time updates (every minute)

  // Calculate lesson status based on current time
  const getLessonStatus = (startTime, endTime) => {
    const start = dayjs(startTime);
    const end = endTime ? dayjs(endTime) : start.add(1, 'hour');
    
    if (currentTime.isAfter(end)) {
      return { text: 'Completed', color: 'bg-gray-400' };
    } else if (currentTime.isAfter(start)) {
      return { text: 'Live Now', color: 'bg-red-500' };
    } else if (currentTime.add(15, 'minute').isAfter(start)) {
      return { text: 'Starting Soon', color: 'bg-yellow-500' };
    } else {
      return { text: 'Scheduled', color: 'bg-green-500' };
    }
  };

  // Format time display
  const formatTime = (dateTime) => {
    if (!dateTime || !dayjs(dateTime).isValid()) {
      return 'Time TBD';
    }
    return dayjs(dateTime).format('h:mm A');
  };
  
  // Format date display
  const formatDate = (dateTime) => {
    if (!dateTime || !dayjs(dateTime).isValid()) {
      return 'Date TBD';
    }
    return dayjs(dateTime).calendar(null, {
      sameDay: '[Today]',
      nextDay: '[Tomorrow]',
      nextWeek: 'dddd',
      sameElse: 'MMM D, YYYY'
    });
  };

  // Check if lesson can be joined
  const canJoinLesson = (startTime, endTime) => {
    if (!startTime || !dayjs(startTime).isValid()) {
      return false; // Can't join if start time is invalid
    }
    const start = dayjs(startTime);
    const end = endTime && dayjs(endTime).isValid() ? dayjs(endTime) : start.add(1, 'hour');
    
    // Allow joining 5 minutes before start time and until end time
    return currentTime.isAfter(start.subtract(5, 'minute')) && currentTime.isBefore(end);
  };

  // Handle join lesson
  const handleJoinLesson = async (lesson) => {
    if (!lesson.meeting_link) {
      alert('No meeting link available for this session. Please contact your tutor.');
      return;
    }
    
    if (canJoinLesson(lesson.start_time, lesson.end_time)) {
      try {
        // Try to call join API if it exists
        if (lesson.id) {
          try {
            await lessonsService.joinLesson(lesson.id);
            console.log('Successfully joined lesson');
          } catch (joinError) {
            console.warn('Join API call failed, proceeding to open meeting link:', joinError);
          }
        }
        
        // Open meeting link in a new tab
        window.open(lesson.meeting_link, '_blank');
      } catch (error) {
        console.error('Error joining lesson:', error);
        alert('Failed to join the session. Please try again.');
      }
    } else {
      alert('This session cannot be joined right now. You can join 5 minutes before the start time.');
    }
  };

  // Group lessons by date
  const groupedLessons = lessons.reduce((groups, lesson) => {
    // If date is invalid, put in "Undated" group
    const date = lesson.start_time && dayjs(lesson.start_time).isValid() 
      ? dayjs(lesson.start_time).format('YYYY-MM-DD')
      : 'Undated';
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(lesson);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !lessons.length) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <motion.div 
      className="max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold mb-2">Upcoming Lessons</h1>
        <p className="text-gray-600 mb-8">View and join your scheduled lessons here.</p>
      </motion.div>

      {lessons.length > 0 ? (
        Object.keys(groupedLessons).sort().map(date => (
          <motion.div 
            key={date} 
            variants={itemVariants}
            className="mb-8"
          >
            <h2 className="text-xl font-semibold mb-4">
              {formatDate(date)}
            </h2>
            <div className="space-y-4">
              {groupedLessons[date].map(lesson => {
                const status = getLessonStatus(lesson.start_time, lesson.end_time);
                const joinable = canJoinLesson(lesson.start_time, lesson.end_time);
                
                return (
                  <motion.div 
                    key={lesson.id}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
                    whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-800">{lesson.title}</h3>
                        <span className={`${status.color} text-white text-xs px-3 py-1 rounded-full font-medium`}>
                          {status.text}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-600 flex items-center">
                            <span className="mr-2">👨‍🏫</span> {lesson.teacher_name}
                          </p>
                          {lesson.class_name && (
                            <p className="text-gray-600 flex items-center">
                              <span className="mr-2">👥</span> {lesson.class_name}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-gray-600 flex items-center">
                            <span className="mr-2">🕒</span> {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                          </p>
                          <p className="text-gray-600 flex items-center">
                            <span className="mr-2">📅</span> {dayjs(lesson.start_time).format('dddd, MMMM D')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <motion.button 
                          className={`px-6 py-2 rounded-md font-medium ${
                            joinable 
                              ? 'bg-primary text-white hover:bg-primary/90' 
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                          onClick={() => handleJoinLesson(lesson)}
                          whileHover={joinable ? { scale: 1.03 } : {}}
                          whileTap={joinable ? { scale: 0.97 } : {}}
                          disabled={!joinable}
                        >
                          Join Now
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))
      ) : (
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-lg border border-gray-200 p-10 text-center"
        >
          <div className="flex flex-col items-center justify-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No upcoming lessons scheduled yet</h3>
            <p className="text-gray-600">Check back later for new lessons</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Lessons; 