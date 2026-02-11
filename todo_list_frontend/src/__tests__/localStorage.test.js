import { loadTasks, saveTasks, isLocalStorageAvailable } from '../utils/localStorage';

describe('localStorage Utility Functions', () => {
  let mockLocalStorage;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};

    global.localStorage = {
      getItem: jest.fn((key) => mockLocalStorage[key] || null),
      setItem: jest.fn((key, value) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: jest.fn((key) => {
        delete mockLocalStorage[key];
      }),
      clear: jest.fn(() => {
        mockLocalStorage = {};
      })
    };

    // Clear console mocks
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('loadTasks', () => {
    test('returns empty array when no tasks are stored', () => {
      const tasks = loadTasks();

      expect(tasks).toEqual([]);
      expect(localStorage.getItem).toHaveBeenCalledWith('retro-todo-tasks');
    });

    test('returns tasks array when valid data exists', () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', completed: false, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: '2', title: 'Task 2', completed: true, createdAt: '2024-01-02T00:00:00.000Z' }
      ];
      mockLocalStorage['retro-todo-tasks'] = JSON.stringify(mockTasks);

      const tasks = loadTasks();

      expect(tasks).toEqual(mockTasks);
      expect(tasks).toHaveLength(2);
    });

    test('returns empty array when stored data is not an array', () => {
      mockLocalStorage['retro-todo-tasks'] = JSON.stringify({ not: 'an array' });

      const tasks = loadTasks();

      expect(tasks).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith(
        'Invalid task data structure in localStorage, returning empty array'
      );
    });

    test('returns empty array when JSON parsing fails', () => {
      mockLocalStorage['retro-todo-tasks'] = 'invalid json{';

      const tasks = loadTasks();

      expect(tasks).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Error loading tasks from localStorage:',
        expect.any(Error)
      );
    });

    test('handles localStorage.getItem throwing an error', () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      const tasks = loadTasks();

      expect(tasks).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Error loading tasks from localStorage:',
        expect.any(Error)
      );
    });

    test('correctly parses complex task objects', () => {
      const mockTasks = [
        {
          id: 'uuid-123',
          title: 'Complex Task with "quotes" and \'apostrophes\'',
          completed: true,
          createdAt: '2024-01-01T12:34:56.789Z'
        }
      ];
      mockLocalStorage['retro-todo-tasks'] = JSON.stringify(mockTasks);

      const tasks = loadTasks();

      expect(tasks).toEqual(mockTasks);
      expect(tasks[0].title).toContain('quotes');
    });
  });

  describe('saveTasks', () => {
    test('saves tasks array to localStorage', () => {
      const tasks = [
        { id: '1', title: 'Task 1', completed: false, createdAt: '2024-01-01T00:00:00.000Z' }
      ];

      const result = saveTasks(tasks);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'retro-todo-tasks',
        JSON.stringify(tasks)
      );
      expect(mockLocalStorage['retro-todo-tasks']).toBe(JSON.stringify(tasks));
    });

    test('saves empty array', () => {
      const result = saveTasks([]);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('retro-todo-tasks', '[]');
    });

    test('saves multiple tasks', () => {
      const tasks = [
        { id: '1', title: 'Task 1', completed: false, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: '2', title: 'Task 2', completed: true, createdAt: '2024-01-02T00:00:00.000Z' },
        { id: '3', title: 'Task 3', completed: false, createdAt: '2024-01-03T00:00:00.000Z' }
      ];

      const result = saveTasks(tasks);

      expect(result).toBe(true);
      expect(mockLocalStorage['retro-todo-tasks']).toBe(JSON.stringify(tasks));
    });

    test('handles QuotaExceededError gracefully', () => {
      localStorage.setItem.mockImplementation(() => {
        const error = new Error('Quota exceeded');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const tasks = [{ id: '1', title: 'Task', completed: false }];
      const result = saveTasks(tasks);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'localStorage quota exceeded. Try clearing completed tasks.'
      );
    });

    test('handles other localStorage errors', () => {
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      const tasks = [{ id: '1', title: 'Task', completed: false }];
      const result = saveTasks(tasks);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Error saving tasks to localStorage:',
        expect.any(Error)
      );
    });

    test('correctly serializes tasks with special characters', () => {
      const tasks = [
        {
          id: '1',
          title: 'Task with "quotes", \'apostrophes\', and emojis 🎉',
          completed: false,
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      const result = saveTasks(tasks);

      expect(result).toBe(true);
      const saved = JSON.parse(mockLocalStorage['retro-todo-tasks']);
      expect(saved[0].title).toContain('🎉');
    });
  });

  describe('isLocalStorageAvailable', () => {
    test('returns true when localStorage is available', () => {
      const available = isLocalStorageAvailable();

      expect(available).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('__localStorage_test__', 'test');
      expect(localStorage.removeItem).toHaveBeenCalledWith('__localStorage_test__');
    });

    test('returns false when localStorage.setItem throws an error', () => {
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage disabled');
      });

      const available = isLocalStorageAvailable();

      expect(available).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        'localStorage is not available:',
        expect.any(Error)
      );
    });

    test('returns false when localStorage.removeItem throws an error', () => {
      localStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage disabled');
      });

      const available = isLocalStorageAvailable();

      expect(available).toBe(false);
    });

    test('cleans up test key even if error occurs', () => {
      const available = isLocalStorageAvailable();

      expect(available).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith('__localStorage_test__');
    });
  });

  describe('Integration: load and save', () => {
    test('data saved can be loaded back correctly', () => {
      const originalTasks = [
        { id: '1', title: 'Task 1', completed: false, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: '2', title: 'Task 2', completed: true, createdAt: '2024-01-02T00:00:00.000Z' }
      ];

      saveTasks(originalTasks);
      const loadedTasks = loadTasks();

      expect(loadedTasks).toEqual(originalTasks);
    });

    test('updates persist after multiple save operations', () => {
      const tasks1 = [
        { id: '1', title: 'Task 1', completed: false, createdAt: '2024-01-01T00:00:00.000Z' }
      ];
      saveTasks(tasks1);

      const tasks2 = [
        { id: '1', title: 'Task 1', completed: true, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: '2', title: 'Task 2', completed: false, createdAt: '2024-01-02T00:00:00.000Z' }
      ];
      saveTasks(tasks2);

      const loadedTasks = loadTasks();
      expect(loadedTasks).toEqual(tasks2);
      expect(loadedTasks).toHaveLength(2);
    });

    test('empty array overwrites previous data', () => {
      const tasks = [
        { id: '1', title: 'Task 1', completed: false, createdAt: '2024-01-01T00:00:00.000Z' }
      ];
      saveTasks(tasks);
      
      saveTasks([]);
      
      const loadedTasks = loadTasks();
      expect(loadedTasks).toEqual([]);
    });
  });
});
