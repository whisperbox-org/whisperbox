/**
 * UI Configuration
 * Constants and settings related to the user interface.
 */

// UI settings
export const UI_CONFIG = {
  // Toast notification duration (in milliseconds)
  TOAST_DURATION: 5000,
  
  // Default animation configuration for transitions
  DEFAULT_ANIMATION: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  },
}; 