import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { assignmentsService } from '../../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';
import { CheckCircle } from 'lucide-react';

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

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    transition: {
      duration: 0.2
    }
  }
};

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState({ success: false, error: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch assignments data
  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await assignmentsService.getAssignments();
        
        if (!response || !response.data) {
          throw new Error('The server returned an invalid response format');
        }
        
        let assignmentsData = Array.isArray(response.data) ? response.data : [];
        
        // Format the assignments data
        const formattedAssignments = assignmentsData.map(assignment => ({
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.due_date ? dayjs(assignment.due_date) : null,
          status: assignment.status,
          subject: assignment.subject || 'General',
          fileUrl: assignment.file,
          maxScore: assignment.max_score || 100,
          score: assignment.grade_info?.points || assignment.score || 0,
          submitted: Boolean(assignment.submitted),
          submissionDate: assignment.submission_date ? dayjs(assignment.submission_date) : null,
          feedbackReceived: assignment.feedback_received || Boolean(assignment.grade_info),
          feedback: assignment.grade_info?.feedback || assignment.feedback
        }));
        
        // Sort by due date (closest first)
        formattedAssignments.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.diff(b.dueDate);
        });
        
        setAssignments(formattedAssignments);
      } catch (err) {
        console.error('Error fetching assignments:', err);
        setError('Failed to load assignments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSubmissionFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    
    setIsSubmitting(true);
    setSubmissionStatus({ success: false, error: null });
    
    try {
      const formData = new FormData();
      if (submissionFile) {
        formData.append('file', submissionFile);
      }
      formData.append('notes', submissionNotes);
      
      await assignmentsService.submitAssignment(selectedAssignment.id, formData);
      
      setAssignments(prevAssignments => 
        prevAssignments.map(assignment => 
          assignment.id === selectedAssignment.id 
            ? { ...assignment, submitted: true, submissionDate: dayjs() }
            : assignment
        )
      );
      
      setSubmissionStatus({ success: true, error: null });
      setSubmissionFile(null);
      setSubmissionNotes('');
      setSelectedAssignment(null);
    } catch (err) {
      console.error('Error submitting assignment:', err);
      setSubmissionStatus({ 
        success: false, 
        error: err.response?.data?.error || 'Failed to submit assignment. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusText = (assignment) => {
    if (assignment.feedbackReceived) return 'Graded';
    if (assignment.submitted) return 'Submitted';
    if (assignment.dueDate && assignment.dueDate.isBefore(dayjs())) return 'Overdue';
    if (assignment.dueDate && assignment.dueDate.diff(dayjs(), 'day') < 3) return 'Due Soon';
    return 'Pending';
  };

  const getStatusColor = (assignment) => {
    if (assignment.feedbackReceived) return 'bg-green-100 text-green-800';
    if (assignment.submitted) return 'bg-blue-100 text-blue-800';
    if (assignment.dueDate && assignment.dueDate.isBefore(dayjs())) return 'bg-red-100 text-red-800';
    if (assignment.dueDate && assignment.dueDate.diff(dayjs(), 'day') < 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

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
      className="max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 
        className="text-3xl font-bold mb-8"
        variants={itemVariants}
      >
        Your Assignments
      </motion.h1>
      
      {assignments.length === 0 ? (
        <motion.div 
          className="bg-white rounded-lg p-6 border border-gray-200 text-center text-gray-600"
          variants={itemVariants}
        >
          No assignments found. Check back later for new assignments.
        </motion.div>
      ) : (
        <motion.div 
          className="grid gap-6"
          variants={itemVariants}
        >
          {/* Assignment List */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 font-medium text-gray-700 bg-gray-50">
              All Assignments
            </div>
            <ul className="divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <motion.li 
                  key={assignment.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedAssignment(assignment)}
                  whileHover={{ x: 5 }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{assignment.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{assignment.subject}</p>
                      {assignment.dueDate && (
                        <p className="text-sm mt-1">
                          Due: <span className="font-medium">{assignment.dueDate.format('MMM D, YYYY')}</span>
                        </p>
                      )}
                      {assignment.feedbackReceived && (
                        <div className="mt-2 p-2 bg-green-50 rounded">
                          <p className="text-sm font-medium text-green-800">
                            Score: <span className="font-bold">
                              {assignment.score || 0}/{assignment.maxScore || 100}
                            </span>
                            <span className="ml-2">
                              ({Math.round(((assignment.score || 0) / (assignment.maxScore || 100)) * 100)}%)
                            </span>
                          </p>
                          {assignment.feedback && (
                            <p className="text-sm text-green-700 mt-1">
                              Feedback: {assignment.feedback}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(assignment)}`}>
                      {getStatusText(assignment)}
                    </span>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {/* Assignment Details Modal */}
      <AnimatePresence>
        {selectedAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedAssignment.title}</h2>
                    <p className="text-sm text-gray-600 mt-1">{selectedAssignment.subject}</p>
                  </div>
                  <button
                    onClick={() => setSelectedAssignment(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Assignment Info */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600">{selectedAssignment.description}</p>
                  </div>

                  {/* Due Date and Status */}
                  <div className="flex items-center space-x-4 text-sm">
                    {selectedAssignment.dueDate && (
                      <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Due {selectedAssignment.dueDate.format('MMM D, YYYY')}
                      </div>
                    )}
                    <span className={`px-3 py-1 rounded-full ${getStatusColor(selectedAssignment)}`}>
                      {getStatusText(selectedAssignment)}
                    </span>
                  </div>

                  {/* Assignment File */}
                  {selectedAssignment.fileUrl && (
                    <div>
                      <a 
                        href={selectedAssignment.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Download Assignment
                      </a>
                    </div>
                  )}

                  {/* Submission Form */}
                  {!selectedAssignment.submitted ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Upload Assignment
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="file"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-lg file:border-0
                              file:text-sm file:font-semibold
                              file:bg-blue-50 file:text-blue-700
                              hover:file:bg-blue-100"
                          />
                          {submissionFile && (
                            <span className="text-sm text-gray-600">
                              {submissionFile.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Additional Notes
                        </label>
                        <textarea
                          value={submissionNotes}
                          onChange={(e) => setSubmissionNotes(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          placeholder="Add any additional notes or comments..."
                        />
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedAssignment(null)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!submissionFile || isSubmitting}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Assignment Submitted</span>
                      </div>
                      <p className="mt-1 text-sm text-green-600">
                        Your assignment has been submitted successfully.
                        {selectedAssignment.submissionDate && (
                          <span> on {selectedAssignment.submissionDate.format('MMM D, YYYY [at] h:mm A')}</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Feedback */}
                  {selectedAssignment.feedbackReceived && selectedAssignment.feedback && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Feedback</h3>
                      <p className="text-sm text-gray-600">{selectedAssignment.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Assignments;