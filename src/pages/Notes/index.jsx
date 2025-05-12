import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { notesService } from '../../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';
import { Dialog, DialogContent, DialogTitle, IconButton, Button, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { jsPDF } from 'jspdf';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

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
  const [selectedNote, setSelectedNote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  const handleDownload = async (note, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    try {
      // Create new PDF document with proper margins
      const doc = new jsPDF({
        unit: 'pt',
        format: 'a4',
        orientation: 'portrait'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      const contentWidth = pageWidth - (2 * margin);
      
      // Set font styles
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      
      // Add title with proper centering
      const titleWidth = doc.getTextWidth(note.title);
      doc.text(note.title, (pageWidth - titleWidth) / 2, 60);
      
      // Add subject with proper styling
      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.text(`Subject: ${note.subject}`, margin, 90);
      
      // Format the content
      const formattedContent = formatNotes(note.description || '');
      
      // Split content into sections based on headers
      const sections = formattedContent.split(/(?=#{1,6}\s)/);
      
      let yPosition = 120;
      
      sections.forEach(section => {
        // Check if we need a new page
        if (yPosition > 750) {
          doc.addPage();
          yPosition = margin;
        }
        
        // Check if this is a header
        const headerMatch = section.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const text = headerMatch[2];
          
          // Set header style based on level
          doc.setFont("helvetica", "bold");
          const headerSizes = {
            1: 24,
            2: 20,
            3: 18,
            4: 16,
            5: 14,
            6: 12
          };
          doc.setFontSize(headerSizes[level] || 16);
          
          // Add header with proper spacing
          doc.text(text, margin, yPosition);
          yPosition += 30;
          
          // Reset font for content
          doc.setFont("helvetica", "normal");
          doc.setFontSize(12);
        } else {
          // Process regular content
          const lines = section.split('\n');
          
          lines.forEach(line => {
            // Check if we need a new page
            if (yPosition > 750) {
              doc.addPage();
              yPosition = margin;
            }
            
            // Handle different line types
            if (line.startsWith('* ')) {
              // Bullet point with proper indentation
              doc.text('• ' + line.substring(2), margin + 20, yPosition);
              yPosition += 20;
            } else if (line.match(/^\d+\.\s/)) {
              // Numbered list with proper indentation
              doc.text(line, margin + 20, yPosition);
              yPosition += 20;
            } else if (line.startsWith('**') && line.endsWith('**')) {
              // Bold text
              doc.setFont("helvetica", "bold");
              const boldText = line.replace(/\*\*/g, '');
              doc.text(boldText, margin, yPosition);
              doc.setFont("helvetica", "normal");
              yPosition += 20;
            } else if (line.includes('$')) {
              // Mathematical equation with proper formatting
              const equation = line.match(/\$(.*?)\$/)?.[1];
              if (equation) {
                // Center the equation
                doc.setFontSize(14);
                const equationWidth = doc.getTextWidth(equation);
                doc.text(equation, (pageWidth - equationWidth) / 2, yPosition);
                doc.setFontSize(12);
                yPosition += 30;
              }
            } else if (line.trim()) {
              // Regular text with proper wrapping
              const splitText = doc.splitTextToSize(line, contentWidth);
              splitText.forEach(text => {
                if (yPosition > 750) {
                  doc.addPage();
                  yPosition = margin;
                }
                doc.text(text, margin, yPosition);
                yPosition += 20;
              });
            } else {
              // Empty line with proper spacing
              yPosition += 15;
            }
          });
        }
      });
      
      // Add metadata at the bottom with proper styling
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      const metadataY = 800;
      doc.text(`Uploaded by: ${note.uploadedBy}`, margin, metadataY);
      doc.text(`Date: ${note.uploadedAt?.format('MMMM D, YYYY')}`, margin, metadataY + 15);
      
      // Add page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 60, 800);
      }
      
      // Save the PDF
      const fileName = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      doc.save(fileName);
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again later.');
    }
  };

  const handleNoteClick = (note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNote(null);
  };

  const formatNotes = (content) => {
    if (!content) return '';
    
    // Format headers
    content = content.replace(/#{1,6}\s/g, (match) => `\n${match}`);
    
    // Format mathematical equations
    content = content.replace(/\$\$(.*?)\$\$/g, (match, p1) => `$${p1}$`);
    
    // Format lists
    content = content.replace(/^\s*[\*\-]\s/gm, '\n* ');
    content = content.replace(/^\s*\d+\.\s/gm, '\n$&');
    
    // Format bold text
    content = content.replace(/\*\*(.*?)\*\*/g, '\n**$1**\n');
    
    // Clean up multiple newlines
    content = content.replace(/\n{3,}/g, '\n\n');
    
    return content.trim();
  };

  const renderNotes = (content) => {
    if (!content) return '';
    
    return (
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-3" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-2" {...props} />,
          p: ({node, ...props}) => <p className="mb-4" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-4" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-4" {...props} />,
          li: ({node, ...props}) => <li className="mb-2" {...props} />,
          strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
          em: ({node, ...props}) => <em className="italic" {...props} />,
          code: ({node, inline, ...props}) => 
            inline ? 
              <code className="bg-gray-100 px-1 rounded" {...props} /> :
              <code className="block bg-gray-100 p-2 rounded mb-4" {...props} />
        }}
      >
        {formatNotes(content)}
      </ReactMarkdown>
    );
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
    <div className="container mx-auto px-4 py-8">
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
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleNoteClick(note)}
            >
              <h3 className="text-xl font-semibold mb-2">{note.title}</h3>
              <p className="text-gray-600 mb-4">{note.subject}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Uploaded by {note.uploadedBy}
                </span>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<DownloadIcon />}
                  onClick={(e) => handleDownload(note, e)}
                >
                  Download
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Note View Modal */}
      <Dialog 
        open={isModalOpen} 
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        {selectedNote && (
          <>
            <DialogTitle className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{selectedNote.title}</h2>
                <p className="text-sm text-gray-500">{selectedNote.subject}</p>
              </div>
              <IconButton onClick={handleCloseModal}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <div className="mt-4">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold mb-2">Notes Content</h3>
                  <div className="prose max-w-none">
                    {renderNotes(selectedNote.description)}
                  </div>
                </div>
                <div className="mt-6 flex justify-between items-center text-sm text-gray-500">
                  <div>
                    <p>Uploaded by: {selectedNote.uploadedBy}</p>
                    <p>Date: {selectedNote.uploadedAt?.format('MMMM D, YYYY')}</p>
                  </div>
                  <div className="flex gap-4">
                    {selectedNote.fileUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(selectedNote.fileUrl, '_blank');
                        }}
                        className="flex items-center text-primary hover:text-primary-dark"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Original
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(selectedNote, e);
                      }}
                      className="flex items-center text-primary hover:text-primary-dark"
                    >
                      <DownloadIcon className="w-5 h-5 mr-2" />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </>
        )}
      </Dialog>
    </div>
  );
};

export default Notes; 