/**
 * Theme initialization script
 * This script is imported in index.js and runs before the React app renders
 * to prevent flash of wrong theme
 */

export const initializeTheme = () => {
  // Check localStorage for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  const followSystem = localStorage.getItem('followSystemTheme') === 'true';
  
  if (followSystem) {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Set up listener for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    // Use the correct event listener based on browser support
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // For older browsers
      mediaQuery.addListener(handleChange);
    }
  } else if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export default initializeTheme; 