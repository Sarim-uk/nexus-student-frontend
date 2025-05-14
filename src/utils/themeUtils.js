/**
 * Theme utility functions for Nexus Student Portal
 * These functions help manage theme colors and transitions
 */

/**
 * Apply the user's preferred theme on initial load
 * This should be called as early as possible (e.g., in index.js)
 */
export const initializeTheme = () => {
  // Get theme preference from localStorage
  const savedTheme = localStorage.getItem('theme');
  const followSystem = localStorage.getItem('followSystemTheme') === 'true';
  
  if (followSystem) {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
    
    // Set up listener for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      applyTheme(e.matches ? 'dark' : 'light');
    };
    
    // Use the correct event listener based on browser support
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // For older browsers
      mediaQuery.addListener(handleChange);
    }
  } else if (savedTheme) {
    // Use saved theme
    applyTheme(savedTheme);
  } else {
    // Default to light theme
    applyTheme('light');
  }
};

/**
 * Apply a specific theme to the document
 * @param {string} theme - 'light' or 'dark'
 */
export const applyTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Store in localStorage (but don't override followSystemTheme setting)
  localStorage.setItem('theme', theme);
};

/**
 * Get the current active theme
 * @returns {string} - 'light' or 'dark'
 */
export const getCurrentTheme = () => {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

/**
 * Toggle between light and dark themes
 * @returns {string} - The new active theme
 */
export const toggleTheme = () => {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  applyTheme(newTheme);
  localStorage.setItem('followSystemTheme', 'false');
  
  return newTheme;
};

/**
 * Apply color styles based on the active theme
 * Used to dynamically determine colors in JS when CSS variables aren't available
 * 
 * @param {Object} options - Color options
 * @param {string} options.light - Light theme color
 * @param {string} options.dark - Dark theme color
 * @returns {string} - The color for the current theme
 */
export const themeColor = (options) => {
  const isDark = getCurrentTheme() === 'dark';
  return isDark ? options.dark : options.light;
};

// Common color pairs for easy access
export const themeColors = {
  text: {
    primary: { light: '#1A3C61', dark: '#4299E1' },
    heading: { light: '#1A202C', dark: '#F7FAFC' },
    body: { light: '#4A5568', dark: '#E2E8F0' },
    muted: { light: '#718096', dark: '#A0AEC0' },
  },
  background: {
    primary: { light: '#F7FAFC', dark: '#1A202C' },
    secondary: { light: '#EDF2F7', dark: '#2D3748' },
    card: { light: '#FFFFFF', dark: '#2D3748' },
    highlight: { light: '#EBF8FF', dark: '#2A4365' },
  },
  border: {
    light: { light: '#E2E8F0', dark: '#4A5568' },
    medium: { light: '#CBD5E0', dark: '#2D3748' },
    focus: { light: '#4299E1', dark: '#63B3ED' },
  },
  button: {
    primary: { light: '#1A3C61', dark: '#2B6CB0' },
    primaryHover: { light: '#2B6CB0', dark: '#1A3C61' },
    secondary: { light: '#4299E1', dark: '#2B6CB0' },
    secondaryHover: { light: '#2B6CB0', dark: '#1A3C61' },
  }
}; 