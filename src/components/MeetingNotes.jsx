import React from 'react';
import Latex from 'react-latex-next';

const MeetingNotes = ({ notes }) => {
  if (!notes) return null; // If no notes, render nothing.

  return (
    <div
      className="p-4 rounded shadow mt-3"
      style={{
        backgroundColor: '#001f3f', // Dark navy blue
        color: '#ffffff', // White text
        fontSize: '1rem',
        lineHeight: '1.6',
      }}
    >
      {notes.split('\n').map((line, index) => {
        if (line.startsWith('**') && line.endsWith('**:')) {
          // Bold headings followed by a colon (e.g., Concluding Remarks)
          return (
            <h3
              key={index}
              style={{
                fontWeight: 'bold',
                marginTop: '1rem',
                marginBottom: '0.5rem',
              }}
            >
              {line.replace(/\*\*/g, '').replace(':', '')}:
            </h3>
          );
        } else if (line.startsWith('**') && line.endsWith('**')) {
          // Bold headings
          return (
            <h3 key={index} style={{ fontWeight: 'bold', marginTop: '1rem' }}>
              {line.replace(/\*\*/g, '')}
            </h3>
          );
        } else if (line.startsWith('* ') && line.includes(':')) {
          // Italic subheadings
          return (
            <h5 key={index} style={{ fontStyle: 'italic', marginTop: '1rem' }}>
              {line.replace('* ', '').replace(':', '')}
            </h5>
          );
        } else if (line.startsWith('* ')) {
          // Bulleted list items
          return (
            <li key={index} style={{ marginLeft: '20px', listStyleType: 'disc' }}>
              {line.replace('* ', '')}
            </li>
          );
        } else if (/^\d+\./.test(line)) {
          // Numbered list items
          return (
            <p key={index} style={{ marginLeft: '20px' }}>
              {line}
            </p>
          );
        } else if (line.includes('$$')) {
          // Block LaTeX equations
          const equation = line.replace(/\$\$/g, ''); // Remove double dollar signs
          return (
            <div key={index} style={{ textAlign: 'center', margin: '1rem 0' }}>
              <Latex>{`$$${equation}$$`}</Latex>
            </div>
          );
        } else if (line.includes('$')) {
          // Inline LaTeX equations
          return (
            <p key={index} style={{ marginLeft: '20px' }}>
              <Latex>{line}</Latex>
            </p>
          );
        } else if (line.trim() === '') {
          // Skip empty lines
          return null;
        } else {
          // Plain text paragraphs
          return <p key={index} style={{ marginTop: '1rem' }}>{line}</p>;
        }
      })}
    </div>
  );
};

export default MeetingNotes;
