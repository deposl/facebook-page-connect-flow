
/**
 * Utility to manage user ID from different sources
 * Supports both URL query parameters and global window variables
 */

export const getUserId = (): string => {
  // First, try to get from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userIdFromUrl = urlParams.get('user_id');
  
  if (userIdFromUrl && userIdFromUrl.trim() !== '') {
    return userIdFromUrl;
  }
  
  // Second, try to get from global window variable (set by Laravel)
  if (typeof window !== 'undefined' && (window as any).USER_ID) {
    return (window as any).USER_ID.toString();
  }
  
  // Default fallback
  return '';
};

export const setUserIdGlobally = (userId: string): void => {
  if (typeof window !== 'undefined') {
    (window as any).USER_ID = userId;
  }
};
