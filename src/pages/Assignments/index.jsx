import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { assignmentsService } from '../../services/api';
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
          score: assignment.score,
          submitted: assignment.submitted || false,
          submissionDate: assignment.submission_date ? dayjs(assignment.submission_date) : null,
          feedbackReceived: assignment.feedback_received || false
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
      // Create form data for file upload
      const formData = new FormData();
      if (submissionFile) {
        formData.append('file', submissionFile);
      }
      formData.append('notes', submissionNotes);
      
      await assignmentsService.submitAssignment(selectedAssignment.id, formData);
      
      // Update the local state to reflect submission
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

  // Function to determine status badge color
  const getStatusColor = (assignment) => {
    if (assignment.submitted) return 'bg-green-100 text-green-800';
    if (assignment.dueDate && assignment.dueDate.isBefore(dayjs())) return 'bg-red-100 text-red-800';
    if (assignment.dueDate && assignment.dueDate.diff(dayjs(), 'day') < 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  // Function to determine status text
  const getStatusText = (assignment) => {
    if (assignment.submitted) return 'Submitted';
    if (assignment.dueDate && assignment.dueDate.isBefore(dayjs())) return 'Overdue';
    if (assignment.dueDate && assignment.dueDate.diff(dayjs(), 'day') < 3) return 'Due Soon';
    return 'Pending';
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
                  onClick={() => setSelectedAssignment(assignment === selectedAssignment ? null : assignment)}
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
                      {assignment.submitted && assignment.score !== undefined && (
                        <p className="text-sm mt-1">
                          Score: <span className="font-bold">{assignment.score}/{assignment.maxScore}</span>
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(assignment)}`}>
                      {getStatusText(assignment)}
                    </span>
                  </div>
                  
                  {/* Assignment Details Panel */}
                  {selectedAssignment && selectedAssignment.id === assignment.id && (
                    <motion.div 
                      className="mt-4 pt-4 border-t border-gray-200"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                    >
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-gray-600 mb-4">{assignment.description}</p>
                      
                      {assignment.fileUrl && (
                        <div className="mb-4">
                          <a 
                            href={assignment.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-primary hover:text-primary-dark transition"
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Download Assignment
                          </a>
                        </div>
                      )}
                      
                      {!assignment.submitted ? (
                        <form onSubmit={handleSubmit} className="mt-4">
                          <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="file">
                              Upload Submission
                            </label>
                            <input
                              type="file"
                              id="file"
                              onChange={handleFileChange}
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                          </div>
                          <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
                              Notes (Optional)
                            </label>
                            <textarea
                              id="notes"
                              rows="3"
                              value={submissionNotes}
                              onChange={(e) => setSubmissionNotes(e.target.value)}
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              placeholder="Add any notes about your submission..."
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="bg-primary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline hover:bg-primary/90 transition disabled:opacity-50"
                            >
                              {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                            </button>
                          </div>
                          
                          {submissionStatus.error && (
                            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                              {submissionStatus.error}
                            </div>
                          )}
                          
                          {submissionStatus.success && (
                            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
                              Assignment submitted successfully!
                            </div>
                          )}
                        </form>
                      ) : (
                        <div className="mt-4 bg-gray-50 p-4 rounded">
                          <p className="text-gray-700 font-medium">
                            Submitted on {assignment.submissionDate.format('MMM D, YYYY [at] h:mm A')}
                          </p>
                          {assignment.feedbackReceived && (
                            <div className="mt-2">
                              <h4 className="font-medium mb-1">Feedback</h4>
                              <p className="text-gray-600">{assignment.feedback || 'No feedback provided yet.'}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Assignments; 