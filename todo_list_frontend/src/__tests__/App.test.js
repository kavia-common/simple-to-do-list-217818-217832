import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import * as localStorageUtils from '../utils/localStorage';

// Mock the localStorage utilities
jest.mock('../utils/localStorage');

describe('App Component - To-Do List Integration Tests', () => {
  let mockLocalStorage;

  beforeEach(() => {
    // Setup mock localStorage
    mockLocalStorage = {};
    
    localStorageUtils.isLocalStorageAvailable.mockReturnValue(true);
    localStorageUtils.loadTasks.mockReturnValue([]);
    localStorageUtils.saveTasks.mockImplementation((tasks) => {
      mockLocalStorage.tasks = tasks;
      return true;
    });

    // Mock crypto.randomUUID
    global.crypto = {
      randomUUID: jest.fn(() => 'test-uuid-' + Date.now())
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render and Empty State', () => {
    test('renders the app with title and subtitle', () => {
      render(<App />);
      
      expect(screen.getByText('Retro To-Do List')).toBeInTheDocument();
      expect(screen.getByText('Keep it simple, keep it retro')).toBeInTheDocument();
    });

    test('displays empty state message when no tasks exist', () => {
      render(<App />);
      
      expect(screen.getByText(/No tasks yet! Add one above to get started./i)).toBeInTheDocument();
    });

    test('loads tasks from localStorage on mount', () => {
      const mockTasks = [
        { id: '1', title: 'Test Task', completed: false, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      expect(localStorageUtils.loadTasks).toHaveBeenCalled();
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    test('displays warning when localStorage is unavailable', () => {
      localStorageUtils.isLocalStorageAvailable.mockReturnValue(false);

      render(<App />);

      expect(screen.getByText(/localStorage unavailable - tasks won't persist across sessions/i)).toBeInTheDocument();
    });
  });

  describe('Task Creation (Add)', () => {
    test('adds a new task when user types and clicks Add button', async () => {
      render(<App />);

      const input = screen.getByPlaceholderText('What needs to be done?');
      const addButton = screen.getByRole('button', { name: /add task/i });

      await userEvent.type(input, 'New Task');
      fireEvent.click(addButton);

      expect(screen.getByText('New Task')).toBeInTheDocument();
      expect(localStorageUtils.saveTasks).toHaveBeenCalled();
    });

    test('adds a new task when user presses Enter key', async () => {
      render(<App />);

      const input = screen.getByPlaceholderText('What needs to be done?');

      await userEvent.type(input, 'Task via Enter{Enter}');

      expect(screen.getByText('Task via Enter')).toBeInTheDocument();
      expect(localStorageUtils.saveTasks).toHaveBeenCalled();
    });

    test('clears input field after adding a task', async () => {
      render(<App />);

      const input = screen.getByPlaceholderText('What needs to be done?');

      await userEvent.type(input, 'Clear me{Enter}');

      expect(input.value).toBe('');
    });

    test('does not add empty task', async () => {
      render(<App />);

      const input = screen.getByPlaceholderText('What needs to be done?');
      const addButton = screen.getByRole('button', { name: /add task/i });

      fireEvent.click(addButton);

      expect(screen.getByText(/No tasks yet!/i)).toBeInTheDocument();
    });

    test('does not add whitespace-only task', async () => {
      render(<App />);

      const input = screen.getByPlaceholderText('What needs to be done?');

      await userEvent.type(input, '   {Enter}');

      expect(screen.getByText(/No tasks yet!/i)).toBeInTheDocument();
    });

    test('enforces 200 character limit', async () => {
      render(<App />);

      const input = screen.getByPlaceholderText('What needs to be done?');
      const longText = 'a'.repeat(250);

      await userEvent.type(input, longText);

      expect(input.value.length).toBeLessThanOrEqual(200);
    });

    test('displays character counter', () => {
      render(<App />);

      expect(screen.getByText(/0\/200/)).toBeInTheDocument();
    });

    test('multiple tasks can be added', async () => {
      render(<App />);

      const input = screen.getByPlaceholderText('What needs to be done?');

      await userEvent.type(input, 'Task 1{Enter}');
      await userEvent.type(input, 'Task 2{Enter}');
      await userEvent.type(input, 'Task 3{Enter}');

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();
    });
  });

  describe('Task Display', () => {
    test('displays all tasks in the list', () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', completed: false, createdAt: new Date().toISOString() },
        { id: '2', title: 'Task 2', completed: true, createdAt: new Date().toISOString() },
        { id: '3', title: 'Task 3', completed: false, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();
    });

    test('displays completed tasks with visual distinction', () => {
      const mockTasks = [
        { id: '1', title: 'Completed Task', completed: true, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      const taskElement = screen.getByText('Completed Task').closest('.todo-item');
      expect(taskElement).toHaveClass('completed');
    });

    test('displays task counts correctly', () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', completed: false, createdAt: new Date().toISOString() },
        { id: '2', title: 'Task 2', completed: true, createdAt: new Date().toISOString() },
        { id: '3', title: 'Task 3', completed: false, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      expect(screen.getByText(/3.*tasks total/i)).toBeInTheDocument();
      expect(screen.getByText(/2.*active/i)).toBeInTheDocument();
      expect(screen.getByText(/1.*completed/i)).toBeInTheDocument();
    });
  });

  describe('Task Completion Toggle', () => {
    test('toggles task completion when checkbox is clicked', async () => {
      const mockTasks = [
        { id: '1', title: 'Toggle Task', completed: false, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);

      expect(checkbox).toBeChecked();
      expect(localStorageUtils.saveTasks).toHaveBeenCalled();
    });

    test('can toggle task from complete to incomplete', async () => {
      const mockTasks = [
        { id: '1', title: 'Completed Task', completed: true, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);

      expect(checkbox).not.toBeChecked();
    });

    test('updates task counts when toggling completion', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', completed: false, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      expect(screen.getByText(/1.*active/i)).toBeInTheDocument();
      expect(screen.getByText(/0.*completed/i)).toBeInTheDocument();

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(screen.getByText(/0.*active/i)).toBeInTheDocument();
      expect(screen.getByText(/1.*completed/i)).toBeInTheDocument();
    });
  });

  describe('Task Editing', () => {
    test('enters edit mode when edit button is clicked', async () => {
      const mockTasks = [
        { id: '1', title: 'Edit Me', completed: false, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      const editButton = screen.getByLabelText(/Edit "Edit Me"/i);
      fireEvent.click(editButton);

      const editInput = screen.getByDisplayValue('Edit Me');
      expect(editInput).toBeInTheDocument();
      expect(editInput).toHaveFocus();
    });

    test('saves edited task when Enter is pressed', async () => {
      const mockTasks = [
        { id: '1', title: 'Original', completed: false, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      const editButton = screen.getByLabelText(/Edit "Original"/i);
      fireEvent.click(editButton);

      const editInput = screen.getByDisplayValue('Original');
      await userEvent.clear(editInput);
      await userEvent.type(editInput, 'Updated{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Updated')).toBeInTheDocument();
      });
      expect(localStorageUtils.saveTasks).toHaveBeenCalled();
    });

    test('saves edited task when clicking outside (blur)', async () => {
      const mockTasks = [
        { id: '1', title: 'Original', completed: false, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      const editButton = screen.getByLabelText(/Edit "Original"/i);
      fireEvent.click(editButton);

      const editInput = screen.getByDisplayValue('Original');
      await userEvent.clear(editInput);
      await userEvent.type(editInput, 'Blur Update');
      
      fireEvent.blur(editInput);

      await waitFor(() => {
        expect(screen.getByText('Blur Update')).toBeInTheDocument();
      });
    });

    test('cancels editing when Escape is pressed', async () => {
      const mockTasks = [
        { id: '1', title: 'Original', completed: false, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      const editButton = screen.getByLabelText(/Edit "Original"/i);
      fireEvent.click(editButton);

      const editInput = screen.getByDisplayValue('Original');
      await userEvent.clear(editInput);
      await userEvent.type(editInput, 'Changed');
      fireEvent.keyDown(editInput, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.getByText('Original')).toBeInTheDocument();
      });
      expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    });

    test('reverts to original title if edited to empty string', async () => {
      const mockTasks = [
        { id: '1', title: 'Original', completed: false, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      const editButton = screen.getByLabelText(/Edit "Original"/i);
      fireEvent.click(editButton);

      const editInput = screen.getByDisplayValue('Original');
      await userEvent.clear(editInput);
      fireEvent.keyDown(editInput, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Original')).toBeInTheDocument();
      });
    });

    test('preserves completion status during edit', async () => {
      const mockTasks = [
        { id: '1', title: 'Completed', completed: true, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      const editButton = screen.getByLabelText(/Edit "Completed"/i);
      fireEvent.click(editButton);

      const editInput = screen.getByDisplayValue('Completed');
      await userEvent.clear(editInput);
      await userEvent.type(editInput, 'Still Completed{Enter}');

      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeChecked();
      });
    });
  });

  describe('Task Deletion', () => {
    test('deletes task when delete button is clicked', async () => {
      const mockTasks = [
        { id: '1', title: 'Delete Me', completed: false, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      expect(screen.getByText('Delete Me')).toBeInTheDocument();

      const deleteButton = screen.getByLabelText(/Delete "Delete Me"/i);
      fireEvent.click(deleteButton);

      expect(screen.queryByText('Delete Me')).not.toBeInTheDocument();
      expect(localStorageUtils.saveTasks).toHaveBeenCalled();
    });

    test('shows empty state after deleting last task', async () => {
      const mockTasks = [
        { id: '1', title: 'Last Task', completed: false, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      const deleteButton = screen.getByLabelText(/Delete "Last Task"/i);
      fireEvent.click(deleteButton);

      expect(screen.getByText(/No tasks yet!/i)).toBeInTheDocument();
    });

    test('updates task counts after deletion', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', completed: false, createdAt: new Date().toISOString() },
        { id: '2', title: 'Task 2', completed: false, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      expect(screen.getByText(/2.*tasks total/i)).toBeInTheDocument();

      const deleteButtons = screen.getAllByTitle('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText(/1.*task total/i)).toBeInTheDocument();
    });
  });

  describe('Task Filtering', () => {
    const mockMixedTasks = [
      { id: '1', title: 'Active Task 1', completed: false, createdAt: new Date().toISOString() },
      { id: '2', title: 'Completed Task 1', completed: true, createdAt: new Date().toISOString() },
      { id: '3', title: 'Active Task 2', completed: false, createdAt: new Date().toISOString() },
      { id: '4', title: 'Completed Task 2', completed: true, createdAt: new Date().toISOString() }
    ];

    test('shows all tasks by default', () => {
      localStorageUtils.loadTasks.mockReturnValue(mockMixedTasks);

      render(<App />);

      expect(screen.getByText('Active Task 1')).toBeInTheDocument();
      expect(screen.getByText('Completed Task 1')).toBeInTheDocument();
      expect(screen.getByText('Active Task 2')).toBeInTheDocument();
      expect(screen.getByText('Completed Task 2')).toBeInTheDocument();
    });

    test('filters to show only active tasks', async () => {
      localStorageUtils.loadTasks.mockReturnValue(mockMixedTasks);

      render(<App />);

      const activeButton = screen.getByRole('button', { name: /Show Active tasks/i });
      fireEvent.click(activeButton);

      expect(screen.getByText('Active Task 1')).toBeInTheDocument();
      expect(screen.getByText('Active Task 2')).toBeInTheDocument();
      expect(screen.queryByText('Completed Task 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Completed Task 2')).not.toBeInTheDocument();
    });

    test('filters to show only completed tasks', async () => {
      localStorageUtils.loadTasks.mockReturnValue(mockMixedTasks);

      render(<App />);

      const completedButton = screen.getByRole('button', { name: /Show Completed tasks/i });
      fireEvent.click(completedButton);

      expect(screen.queryByText('Active Task 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Active Task 2')).not.toBeInTheDocument();
      expect(screen.getByText('Completed Task 1')).toBeInTheDocument();
      expect(screen.getByText('Completed Task 2')).toBeInTheDocument();
    });

    test('can switch back to All filter', async () => {
      localStorageUtils.loadTasks.mockReturnValue(mockMixedTasks);

      render(<App />);

      const activeButton = screen.getByRole('button', { name: /Show Active tasks/i });
      fireEvent.click(activeButton);

      const allButton = screen.getByRole('button', { name: /Show All tasks/i });
      fireEvent.click(allButton);

      expect(screen.getByText('Active Task 1')).toBeInTheDocument();
      expect(screen.getByText('Completed Task 1')).toBeInTheDocument();
    });

    test('highlights active filter button', async () => {
      localStorageUtils.loadTasks.mockReturnValue(mockMixedTasks);

      render(<App />);

      const allButton = screen.getByRole('button', { name: /Show All tasks/i });
      expect(allButton).toHaveClass('active');

      const activeButton = screen.getByRole('button', { name: /Show Active tasks/i });
      fireEvent.click(activeButton);

      expect(activeButton).toHaveClass('active');
      expect(allButton).not.toHaveClass('active');
    });

    test('task counts reflect all tasks regardless of filter', async () => {
      localStorageUtils.loadTasks.mockReturnValue(mockMixedTasks);

      render(<App />);

      const activeButton = screen.getByRole('button', { name: /Show Active tasks/i });
      fireEvent.click(activeButton);

      // Counts should still show totals from all tasks
      expect(screen.getByText(/4.*tasks total/i)).toBeInTheDocument();
      expect(screen.getByText(/2.*active/i)).toBeInTheDocument();
      expect(screen.getByText(/2.*completed/i)).toBeInTheDocument();
    });
  });

  describe('Clear Completed Tasks', () => {
    test('displays Clear Completed button when completed tasks exist', () => {
      const mockTasks = [
        { id: '1', title: 'Active', completed: false, createdAt: new Date().toISOString() },
        { id: '2', title: 'Completed', completed: true, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      expect(screen.getByRole('button', { name: /Clear all completed tasks/i })).toBeInTheDocument();
    });

    test('hides Clear Completed button when no completed tasks exist', () => {
      const mockTasks = [
        { id: '1', title: 'Active', completed: false, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      expect(screen.queryByRole('button', { name: /Clear all completed tasks/i })).not.toBeInTheDocument();
    });

    test('removes all completed tasks when button is clicked', async () => {
      const mockTasks = [
        { id: '1', title: 'Active 1', completed: false, createdAt: new Date().toISOString() },
        { id: '2', title: 'Completed 1', completed: true, createdAt: new Date().toISOString() },
        { id: '3', title: 'Active 2', completed: false, createdAt: new Date().toISOString() },
        { id: '4', title: 'Completed 2', completed: true, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      const clearButton = screen.getByRole('button', { name: /Clear all completed tasks/i });
      fireEvent.click(clearButton);

      expect(screen.getByText('Active 1')).toBeInTheDocument();
      expect(screen.getByText('Active 2')).toBeInTheDocument();
      expect(screen.queryByText('Completed 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Completed 2')).not.toBeInTheDocument();
    });

    test('updates task counts after clearing completed', async () => {
      const mockTasks = [
        { id: '1', title: 'Active', completed: false, createdAt: new Date().toISOString() },
        { id: '2', title: 'Completed', completed: true, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      const clearButton = screen.getByRole('button', { name: /Clear all completed tasks/i });
      fireEvent.click(clearButton);

      expect(screen.getByText(/1.*task total/i)).toBeInTheDocument();
      expect(screen.getByText(/1.*active/i)).toBeInTheDocument();
      expect(screen.getByText(/0.*completed/i)).toBeInTheDocument();
    });

    test('button disappears after clearing all completed tasks', async () => {
      const mockTasks = [
        { id: '1', title: 'Completed', completed: true, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      const clearButton = screen.getByRole('button', { name: /Clear all completed tasks/i });
      fireEvent.click(clearButton);

      expect(screen.queryByRole('button', { name: /Clear all completed tasks/i })).not.toBeInTheDocument();
    });
  });

  describe('localStorage Integration', () => {
    test('saves tasks to localStorage when adding a task', async () => {
      render(<App />);

      const input = screen.getByPlaceholderText('What needs to be done?');
      await userEvent.type(input, 'Save Test{Enter}');

      expect(localStorageUtils.saveTasks).toHaveBeenCalled();
      const savedTasks = localStorageUtils.saveTasks.mock.calls[0][0];
      expect(savedTasks).toHaveLength(1);
      expect(savedTasks[0].title).toBe('Save Test');
    });

    test('saves tasks to localStorage when editing a task', async () => {
      const mockTasks = [
        { id: '1', title: 'Original', completed: false, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      const editButton = screen.getByLabelText(/Edit "Original"/i);
      fireEvent.click(editButton);

      const editInput = screen.getByDisplayValue('Original');
      await userEvent.clear(editInput);
      await userEvent.type(editInput, 'Edited{Enter}');

      await waitFor(() => {
        expect(localStorageUtils.saveTasks).toHaveBeenCalled();
      });
    });

    test('saves tasks to localStorage when deleting a task', async () => {
      const mockTasks = [
        { id: '1', title: 'Delete Me', completed: false, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      const deleteButton = screen.getByLabelText(/Delete "Delete Me"/i);
      fireEvent.click(deleteButton);

      expect(localStorageUtils.saveTasks).toHaveBeenCalled();
    });

    test('saves tasks to localStorage when toggling completion', async () => {
      const mockTasks = [
        { id: '1', title: 'Toggle', completed: false, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(localStorageUtils.saveTasks).toHaveBeenCalled();
    });

    test('saves tasks to localStorage when clearing completed', async () => {
      const mockTasks = [
        { id: '1', title: 'Active', completed: false, createdAt: new Date().toISOString() },
        { id: '2', title: 'Completed', completed: true, createdAt: new Date().toISOString() }
      ];
      localStorageUtils.loadTasks.mockReturnValue(mockTasks);

      render(<App />);

      const clearButton = screen.getByRole('button', { name: /Clear all completed tasks/i });
      fireEvent.click(clearButton);

      expect(localStorageUtils.saveTasks).toHaveBeenCalled();
    });

    test('does not save to localStorage when unavailable', async () => {
      localStorageUtils.isLocalStorageAvailable.mockReturnValue(false);

      render(<App />);

      const input = screen.getByPlaceholderText('What needs to be done?');
      await userEvent.type(input, 'No Save{Enter}');

      // saveTasks should not be called when localStorage is unavailable
      expect(localStorageUtils.saveTasks).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles rapid task additions', async () => {
      render(<App />);

      const input = screen.getByPlaceholderText('What needs to be done?');

      await userEvent.type(input, 'Task 1{Enter}');
      await userEvent.type(input, 'Task 2{Enter}');
      await userEvent.type(input, 'Task 3{Enter}');

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();
    });

    test('handles task with special characters', async () => {
      render(<App />);

      const input = screen.getByPlaceholderText('What needs to be done?');
      await userEvent.type(input, 'Task with @#$% special chars!{Enter}');

      expect(screen.getByText('Task with @#$% special chars!')).toBeInTheDocument();
    });

    test('handles very long task titles', async () => {
      render(<App />);

      const input = screen.getByPlaceholderText('What needs to be done?');
      const longTitle = 'a'.repeat(200);
      
      await userEvent.type(input, longTitle + '{Enter}');

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    test('footer only appears when tasks exist', () => {
      render(<App />);

      expect(screen.queryByText(/tasks total/i)).not.toBeInTheDocument();
    });

    test('singular form for single task', async () => {
      render(<App />);

      const input = screen.getByPlaceholderText('What needs to be done?');
      await userEvent.type(input, 'Single Task{Enter}');

      expect(screen.getByText(/1.*task total/i)).toBeInTheDocument();
    });

    test('plural form for multiple tasks', async () => {
      render(<App />);

      const input = screen.getByPlaceholderText('What needs to be done?');
      await userEvent.type(input, 'Task 1{Enter}');
      await userEvent.type(input, 'Task 2{Enter}');

      expect(screen.getByText(/2.*tasks total/i)).toBeInTheDocument();
    });
  });
});
