import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { notesService } from '../../services/api';
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

// File type icons mapping
const fileIcons = {
  pdf: (
    <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      <path d="M8.5 9.5a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zm-3 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zm6 1.5a.5.5 0 00-.5-.5h-5a.5.5 0 000 1h5a.5.5 0 00.5-.5zm0 2a.5.5 0 00-.5-.5h-5a.5.5 0 000 1h5a.5.5 0 00.5-.5z" />
    </svg>
  ),
  docx: (
    <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      <path d="M8 10a1 1 0 100-2 1 1 0 000 2zm0 2a1 1 0 100 2 1 1 0 000-2z" />
    </svg>
  ),
  xlsx: (
    <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      <path d="M8 10a1 1 0 100-2 1 1 0 000 2zm0 2a1 1 0 100 2 1 1 0 000-2zm4-4a1 1 0 100-2 1 1 0 000 2zm0 2a1 1 0 100 2 1 1 0 000-2zm0 2a1 1 0 100 2 1 1 0 000-2z" />
    </svg>
  ),
  jpg: (
    <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
    </svg>
  ),
  png: (
    <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
    </svg>
  ),
  default: (
    <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    </svg>
  ),
};

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingIds, setDownloadingIds] = useState([]);

  // Fetch notes data
  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await notesService.getNotes();
        
        if (!response || !response.data) {
          throw new Error('The server returned an invalid response format');
        }
        
        let notesData = Array.isArray(response.data) ? response.data : [];
        console.log('Received notes data:', notesData);
        
        // Format the notes data
        const formattedNotes = notesData.map(note => ({
          id: note.id,
          title: note.title || 'Untitled Note',
          description: note.description || note.content || 'No description provided',
          subject: note.subject || 'General',
          uploadedBy: note.uploaded_by_name || 'Tutor',
          uploadedAt: note.created_at ? dayjs(note.created_at) : null,
          fileUrl: note.file_url || note.file || note.notes_url || '',
          fileType: getFileType(note.file_url || note.file || note.notes_url || ''),
          isNew: note.created_at ? isRecentlyUploaded(note.created_at) : false
        }));
        
        // Sort by uploaded date (newest first)
        formattedNotes.sort((a, b) => {
          if (!a.uploadedAt) return 1;
          if (!b.uploadedAt) return -1;
          return b.uploadedAt.diff(a.uploadedAt);
        });
        
        setNotes(formattedNotes);
      } catch (err) {
        console.error('Error fetching notes:', err);
        setError('Failed to load notes. Please try again later.');
        
        // Always set mock data for development and testing until the backend is ready
        console.log('Using mock notes data while backend is being set up');
        setNotes([
          {
            id: '1',
            title: 'Physics Lecture Notes',
            description: 'Notes from the quantum mechanics lecture',
            subject: 'Physics',
            uploadedBy: 'Dr. Smith',
            uploadedAt: dayjs().subtract(2, 'day'),
            fileUrl: '/mock/files/physics_notes.pdf',
            fileType: 'pdf',
            isNew: true
          },
          {
            id: '2',
            title: 'Calculus Formulas',
            description: 'Key formulas and examples for integration techniques',
            subject: 'Mathematics',
            uploadedBy: 'Prof. Johnson',
            uploadedAt: dayjs().subtract(5, 'day'),
            fileUrl: '/mock/files/calculus.pdf',
            fileType: 'pdf',
            isNew: true
          },
          {
            id: '3',
            title: 'Literature Analysis Template',
            description: 'Template for analyzing literary works',
            subject: 'English Literature',
            uploadedBy: 'Dr. Williams',
            uploadedAt: dayjs().subtract(12, 'day'),
            fileUrl: '/mock/files/literature.docx',
            fileType: 'docx',
            isNew: false
          },
          {
            id: '4',
            title: 'Computer Science Algorithms',
            description: 'Common algorithms and their time complexity analysis',
            subject: 'Computer Science',
            uploadedBy: 'Prof. Taylor',
            uploadedAt: dayjs().subtract(3, 'day'),
            fileUrl: '/mock/files/algorithms.pdf',
            fileType: 'pdf',
            isNew: true
          },
          {
            id: '5',
            title: 'Biology Cell Structure',
            description: 'Detailed notes on cell structure and function',
            subject: 'Biology',
            uploadedBy: 'Dr. Martinez',
            uploadedAt: dayjs().subtract(8, 'day'),
            fileUrl: '/mock/files/biology.pdf',
            fileType: 'pdf',
            isNew: false
          },
          {
            id: '6',
            title: 'Chemistry Periodic Table Reference',
            description: 'Complete periodic table with element properties',
            subject: 'Chemistry',
            uploadedBy: 'Prof. Johnson',
            uploadedAt: dayjs().subtract(15, 'day'),
            fileUrl: '/mock/files/chemistry.xlsx',
            fileType: 'xlsx',
            isNew: false
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  // Determine if a note was uploaded recently (within last 7 days)
  const isRecentlyUploaded = (dateString) => {
    const uploadDate = dayjs(dateString);
    return dayjs().diff(uploadDate, 'day') <= 7;
  };

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

  // Get file icon based on file type
  const getFileIcon = (fileType) => {
    return fileIcons[fileType] || fileIcons.default;
  };

  // Handle file download
  const handleDownload = async (note) => {
    if (!note.fileUrl) return;
    
    // Add note ID to downloading list
    setDownloadingIds(prev => [...prev, note.id]);
    
    try {
      if (['jpg', 'png', 'pdf'].includes(note.fileType)) {
        // For viewable files, open in a new tab
        window.open(note.fileUrl, '_blank');
      } else {
        // For other files, trigger download
        const response = await notesService.downloadNote(note.id);
        
        // Create a blob from the response data
        const blob = new Blob([response.data]);
        
        // Create a URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary anchor element to trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = note.title || `note_${note.id}.${note.fileType}`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Error downloading note:', err);
      alert('Failed to download the note. Please try again later.');
    } finally {
      // Remove note ID from downloading list
      setDownloadingIds(prev => prev.filter(id => id !== note.id));
    }
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
        className="text-3xl font-bold mb-2"
        variants={itemVariants}
      >
        Shared Notes & Resources
      </motion.h1>
      
      <motion.p
        className="text-gray-600 mb-8"
        variants={itemVariants}
      >
        Access notes uploaded by your tutors here.
      </motion.p>
      
      {notes.length === 0 ? (
        <motion.div 
          className="bg-white rounded-lg p-8 border border-gray-200 text-center"
          variants={itemVariants}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p className="text-gray-600 text-lg">No notes shared yet. Please check back later!</p>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={itemVariants}
        >
          {notes.map((note) => (
            <motion.div 
              key={note.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col"
              whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-5 flex-grow">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-lg text-gray-900 mb-1 flex items-center">
                    {note.title}
                    {note.isNew && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary text-white rounded-full">
                        New
                      </span>
                    )}
                  </h3>
                  {getFileIcon(note.fileType)}
                </div>
                
                <p className="text-sm text-gray-500 mb-2">
                  {note.subject}
                </p>
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {note.description}
                </p>
                
                <div className="text-xs text-gray-500 mb-4">
                  <div>By: {note.uploadedBy}</div>
                  {note.uploadedAt && (
                    <div>Uploaded: {note.uploadedAt.format('MMM D, YYYY')}</div>
                  )}
                </div>
              </div>
              
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
                <motion.button
                  onClick={() => handleDownload(note)}
                  disabled={downloadingIds.includes(note.id)}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {downloadingIds.includes(note.id) ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="mr-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      {['jpg', 'png', 'pdf'].includes(note.fileType) ? 'View' : 'Download'}
                    </span>
                  )}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Notes; 