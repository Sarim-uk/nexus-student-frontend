/**
 * Theme initialization utility
 * Used to initialize theme settings before the React app renders
 * to prevent flash of incorrect theme
 */

/**
 * Initialize theme settings on application start
 * This is called from index.js before the app renders
 */
const initializeTheme = () => {
  // Get theme preference from localStorage
  const savedTheme = localStorage.getItem('theme');
  const followSystem = localStorage.getItem('followSystemTheme') === 'true';
  
  // If user prefers to follow system theme
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
    // Use saved theme preference
    document.documentElement.classList.add('dark');
  } else {
    // Default to light theme
    document.documentElement.classList.remove('dark');
  }
};

export default initializeTheme; 