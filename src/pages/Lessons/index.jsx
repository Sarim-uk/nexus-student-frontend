import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { lessonsService } from '../../services/api';
import authService from '../../services/auth';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';
import VideoCallButton from '../../components/VideoCallButton';
import SessionBookingModal from '../../components/modals/SessionBookingModal';

// Initialize dayjs plugins
dayjs.extend(relativeTime);
dayjs.extend(calendar);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
};

const Lessons = React.memo(() => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [tutors, setTutors] = useState([]);
  const [tutorsLoading, setTutorsLoading] = useState(false);
  const [tutorsError, setTutorsError] = useState(null);
  const [selectedTutorId, setSelectedTutorId] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [registeredTutorIds, setRegisteredTutorIds] = useState(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Update current time every 5 minutes instead of every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Fetch lessons and tutors
  const fetchLessonsAndTutors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await lessonsService.getStudentSessions();
      if (!response?.data) throw new Error('Invalid response format');

      let sessionsData = Array.isArray(response.data)
        ? response.data
        : response.data.upcoming_sessions || response.data.sessions || response.data.student_sessions || [];

      const tutorIdsSet = new Set();
      sessionsData.forEach(session => {
        const tutorId = session.tutor_ids || session.tutor_id || (session.tutor?.id) || (session.tutor?.tutor_ids);
        if (tutorId) tutorIdsSet.add(tutorId);
        if (session.tutor_first_name || session.tutor_last_name) {
          for (const key in session) {
            if (key !== 'id' && key !== 'student_ids' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session[key])) {
              tutorIdsSet.add(session[key]);
            }
          }
        }
      });

      setRegisteredTutorIds(tutorIdsSet);

      const formattedSessions = sessionsData.map(session => ({
        id: session.id,
        title: "Session with Tutor",
        teacher_name: session.tutor_name || "Tutor",
        start_time: session.scheduled_time ? dayjs(session.scheduled_time).format() : null,
        end_time: session.scheduled_time ? dayjs(session.scheduled_time).add(1, 'hour').format() : null,
        meeting_link: session.meeting_link || null,
        status: session.status || "Scheduled",
        class_name: "Tutoring Session",
        tutor_id: session.tutor_ids || session.tutor_id
      }));

      const relevantSessions = formattedSessions.filter(session => session.id && session.start_time && dayjs(session.start_time).isValid());
      const sortedSessions = relevantSessions.sort((a, b) => dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf());
      
      setLessons(sortedSessions);
      if (sortedSessions.length === 0) {
        setError('No upcoming sessions found.');
      }

      if (tutorIdsSet.size > 0) {
        await fetchRegisteredTutors(tutorIdsSet);
      }
    } catch (err) {
      setError(`Failed to load sessions: ${err.message || 'Unknown error'}`);
      setLessons([]);
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  }, []);

  // Trigger initial fetch
  useEffect(() => {
    fetchLessonsAndTutors();
  }, [fetchLessonsAndTutors]);

  // Refresh page after full load
  useEffect(() => {
    if (isLoaded && !loading && !tutorsLoading) {
    }
  }, [isLoaded, loading, tutorsLoading]);

  // Fetch registered tutors
  const fetchRegisteredTutors = async (tutorIdsSet) => {
    setTutorsLoading(true);
    setTutorsError(null);

    try {
      const registeredTutors = [];
      for (const tutorId of tutorIdsSet) {
        try {
          const tutorDetails = await lessonsService.getTutorDetails(tutorId);
          if (tutorDetails?.tutor_ids && typeof tutorDetails.tutor_ids === 'number' && !tutorDetails.first_name) {
            const modifiedTutorDetails = {
              ...tutorDetails,
              id: tutorId,
              first_name: "Tutor",
              last_name: `#${tutorDetails.tutor_ids}`,
              email: ""
            };
            registeredTutors.push(modifiedTutorDetails);
            continue;
          }
          if (tutorDetails) registeredTutors.push(tutorDetails);
        } catch (err) {
          try {
            const tutorResponse = await fetch(`/tutors/${tutorId}/`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' }
            });
            if (tutorResponse.ok) {
              const tutorDetails = await tutorResponse.json();
              registeredTutors.push(tutorDetails);
            }
          } catch (altErr) {
            console.error(`Error with alternate endpoint for tutor ${tutorId}:`, altErr);
          }
        }
      }

      if (registeredTutors.length === 0) {
        const allTutors = await lessonsService.getAllTutors();
        registeredTutors.push(...(Array.isArray(allTutors) ? allTutors : allTutors?.results || []));
      }

      const processedTutors = registeredTutors.map(tutor => {
        if (!tutor.first_name && !tutor.last_name && tutor.username) {
          const nameParts = tutor.email?.split('@')[0]?.split('.') || tutor.username.split('.');
          return {
            ...tutor,
            first_name: nameParts[0]?.charAt(0).toUpperCase() + nameParts[0]?.slice(1) || "Tutor",
            last_name: nameParts[1]?.charAt(0).toUpperCase() + nameParts[1]?.slice(1) || `#${Math.floor(Math.random() * 1000)}`
          };
        }
        return { ...tutor, first_name: tutor.first_name || "Tutor", last_name: tutor.last_name || `#${Math.floor(Math.random() * 1000)}` };
      });

      setTutors(processedTutors.length > 0 ? processedTutors : lessons.map(l => ({
        id: l.tutor_id,
        first_name: l.teacher_name?.split(' ')[0] || 'Unknown',
        last_name: l.teacher_name?.split(' ')[1] || ''
      })));
    } catch (err) {
      setTutorsError('Failed to load tutors.');
    } finally {
      setTutorsLoading(false);
    }
  };

  // Memoized lesson status
  const getLessonStatus = useCallback((startTime, endTime) => {
    const start = dayjs(startTime);
    const end = endTime ? dayjs(endTime) : start.add(1, 'hour');
    if (currentTime.isAfter(end)) return { text: 'Completed', color: 'bg-gray-400' };
    if (currentTime.isAfter(start)) return { text: 'Live Now', color: 'bg-red-500' };
    if (currentTime.add(15, 'minute').isAfter(start)) return { text: 'Starting Soon', color: 'bg-yellow-500' };
    return { text: 'Scheduled', color: 'bg-green-500' };
  }, [currentTime]);

  // Memoized time and date formatting
  const formatTime = useCallback(dateTime => dayjs(dateTime).isValid() ? dayjs(dateTime).format('h:mm A') : 'Time TBD', []);
  const formatDate = useCallback(dateTime => dayjs(dateTime).isValid() ? dayjs(dateTime).calendar(null, {
    sameDay: '[Today]', nextDay: '[Tomorrow]', nextWeek: 'dddd', sameElse: 'MMM D, YYYY'
  }) : 'Date TBD', []);

  // Group lessons by date
  const groupedLessons = useMemo(() => lessons.reduce((groups, lesson) => {
    const date = lesson.start_time && dayjs(lesson.start_time).isValid() ? dayjs(lesson.start_time).format('YYYY-MM-DD') : 'Undated';
    groups[date] = groups[date] || [];
    groups[date].push(lesson);
    return groups;
  }, {}), [lessons]);

  // Handle booking
  const handleBookSession = useCallback(tutorId => {
    setSelectedTutorId(tutorId);
    setIsBookingModalOpen(true);
  }, []);

  const handleCloseBookingModal = useCallback(() => {
    setIsBookingModalOpen(false);
    setSelectedTutorId(null);
  }, []);

  const handleBookingSuccess = useCallback(async bookingDetails => {
    setLoading(true);
    setError(null);

    try {
      const response = await lessonsService.getStudentSessions();
      if (!response?.data) throw new Error('Invalid response format');

      let sessionsData = Array.isArray(response.data)
        ? response.data
        : response.data.upcoming_sessions || response.data.sessions || response.data.student_sessions || [];

      const formattedSessions = sessionsData.map(session => ({
        id: session.id,
        title: "Session with Tutor",
        teacher_name: session.tutor_name || "Tutor",
        start_time: session.scheduled_time ? dayjs(session.scheduled_time).format() : null,
        end_time: session.scheduled_time ? dayjs(session.scheduled_time).add(1, 'hour').format() : null,
        meeting_link: session.meeting_link || null,
        status: session.status || "Scheduled",
        class_name: "Tutoring Session",
        tutor_id: session.tutor_ids || session.tutor_id
      }));

      const sortedSessions = formattedSessions.sort((a, b) => dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf());
      
      setLessons(sortedSessions);
      if (sortedSessions.length === 0) {
        setError('No upcoming sessions found.');
      }
    } catch (err) {
      setError(`Failed to refresh sessions: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

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
    <motion.div className="max-w-5xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold mb-2">Upcoming Lessons</h1>
        <p className="text-gray-600 mb-8">View and join your scheduled lessons here.</p>
      </motion.div>

      {lessons.length > 0 ? (
        Object.keys(groupedLessons).sort().map(date => (
          <motion.div key={date} variants={itemVariants} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{formatDate(date)}</h2>
            <div className="space-y-4">
              {groupedLessons[date].map(lesson => {
                const status = getLessonStatus(lesson.start_time, lesson.end_time);
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
                        <VideoCallButton
                          lessonId={lesson.id}
                          disabled={false}
                          className="transform hover:scale-103 active:scale-97 transition-transform"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))
      ) : (
        <motion.div variants={itemVariants} className="bg-white rounded-lg border border-gray-200 p-10 text-center mb-10">
          <div className="flex flex-col items-center justify-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No upcoming lessons scheduled yet</h3>
            <p className="text-gray-600">Check back later for new lessons</p>
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="mt-10">
        <h1 className="text-3xl font-bold mb-2">Book a Session</h1>
        <p className="text-gray-600 mb-8">Select a tutor to book a session at their available time slots.</p>
        {tutorsLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : tutorsError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-8" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {tutorsError}</span>
            <button
              onClick={async () => {
                try {
                  setTutorsLoading(true);
                  const allTutors = await lessonsService.getAllTutors();
                  setTutors(Array.isArray(allTutors) ? allTutors : allTutors?.results || []);
                  setTutorsError(null);
                } catch (err) {
                  setTutorsError('Failed to load tutors.');
                } finally {
                  setTutorsLoading(false);
                }
              }}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              View All Available Tutors
            </button>
          </div>
        ) : tutors.length > 0 ? (
          <div className="max-w-md mx-auto mb-10">
            <div className="relative bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="p-4">
                <label htmlFor="tutor-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Choose a Tutor
                </label>
                <div className="relative">
                  <select
                    id="tutor-select"
                    className="block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md shadow-sm appearance-none bg-white"
                    onChange={e => e.target.value && handleBookSession(e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Select a tutor...</option>
                    {tutors.map(tutor => {
                      const firstName = tutor.first_name || tutor.firstName || tutor.tutor_ids?.first_name || tutor.user?.first_name || '';
                      const lastName = tutor.last_name || tutor.lastName || tutor.tutor_ids?.last_name || tutor.user?.last_name || '';
                      const displayName = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || `Tutor #${tutor.id}`;
                      return (
                        <option key={tutor.id} value={tutor.id}>
                          {displayName}
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{tutors.length} tutors available</span>
                  <button
                    onClick={() => {
                      const select = document.getElementById('tutor-select');
                      if (select.value) handleBookSession(select.value);
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-sm font-medium"
                  >
                    Book Session
                  </button>
                </div>
              </div>
            </div>
            {tutors.length > 0 && (
              <div className="mt-12 mb-16">
                <h3 className="text-2xl font-semibold text-gray-800 mb-8 text-center">Our Featured Tutors</h3>
                <div className="flex flex-wrap justify-center -mx-3">
                  {tutors.slice(0, 6).map(tutor => {
                    const firstName = tutor.first_name || tutor.firstName || tutor.tutor_ids?.first_name || tutor.user?.first_name || '';
                    const lastName = tutor.last_name || tutor.lastName || tutor.tutor_ids?.last_name || tutor.user?.last_name || '';
                    const profilePicture = tutor.profile_picture_url || tutor.tutor_ids?.profile_picture_url || tutor.user?.profile_picture_url;
                    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
                    return (
                      <div key={tutor.id} className="w-full sm:w-1/2 md:w-1/3 px-3 mb-6">
                        <div className="flex flex-col items-center h-full">
                          <div className="mb-4 w-24 h-24 rounded-full bg-gradient-to-r from-primary/90 to-primary-dark border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                            {profilePicture ? (
                              <img src={profilePicture} alt={`${firstName} ${lastName}`} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl text-white font-medium">{initials}</span>
                            )}
                          </div>
                          <div className="h-10 flex items-center justify-center">
                            <h3 className="font-semibold text-lg text-gray-800">{firstName} {lastName}</h3>
                          </div>
                          <div className="mt-auto pt-4">
                            <button 
                              className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors text-sm font-medium shadow-sm hover:shadow"
                              onClick={() => handleBookSession(tutor.id)}
                            >
                              Book Session
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="text-6xl mb-4">👨‍🏫</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No registered tutors found</h3>
              <p className="text-gray-600 mb-4">You don't have any tutors assigned to you yet.</p>
              <button
                onClick={async () => {
                  try {
                    setTutorsLoading(true);
                    const allTutors = await lessonsService.getAllTutors();
                    setTutors(Array.isArray(allTutors) ? allTutors : allTutors?.results || []);
                  } catch (err) {
                    setTutorsError('Failed to load tutors.');
                  } finally {
                    setTutorsLoading(false);
                  }
                }}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
              >
                View All Available Tutors
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <SessionBookingModal
        tutorId={selectedTutorId}
        isOpen={isBookingModalOpen}
        onClose={handleCloseBookingModal}
        onSuccess={handleBookingSuccess}
      />
    </motion.div>
  );
});

export default Lessons;