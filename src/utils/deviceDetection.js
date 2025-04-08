/**
 * Utility functions for device detection
 */

/**
 * Check if the current device is a mobile device
 * @returns {boolean} True if the device is mobile, false otherwise
 */
export const isMobileDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Regular expression for mobile devices
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  return mobileRegex.test(userAgent);
};
