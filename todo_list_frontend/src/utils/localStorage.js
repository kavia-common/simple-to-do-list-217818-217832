/**
 * localStorage utility module for task persistence
 * Handles all localStorage operations with error handling
 */

const STORAGE_KEY = 'retro-todo-tasks';

/**
 * PUBLIC_INTERFACE
 * Load tasks from localStorage
 * @returns {Array} Array of task objects or empty array if none exist
 */
export const loadTasks = () => {
  try {
    const storedTasks = localStorage.getItem(STORAGE_KEY);
    if (!storedTasks) {
      return [];
    }
    const tasks = JSON.parse(storedTasks);
    // Validate data structure
    if (Array.isArray(tasks)) {
      return tasks;
    }
    console.warn('Invalid task data structure in localStorage, returning empty array');
    return [];
  } catch (error) {
    console.error('Error loading tasks from localStorage:', error);
    return [];
  }
};

/**
 * PUBLIC_INTERFACE
 * Save tasks to localStorage
 * @param {Array} tasks - Array of task objects to save
 * @returns {boolean} True if save successful, false otherwise
 */
export const saveTasks = (tasks) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded. Try clearing completed tasks.');
      return false;
    }
    console.error('Error saving tasks to localStorage:', error);
    return false;
  }
};

/**
 * PUBLIC_INTERFACE
 * Check if localStorage is available
 * @returns {boolean} True if localStorage is available and working
 */
export const isLocalStorageAvailable = () => {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn('localStorage is not available:', error);
    return false;
  }
};
