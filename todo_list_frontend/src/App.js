import React, { useState, useEffect } from 'react';
import TodoInput from './components/TodoInput';
import TodoList from './components/TodoList';
import TodoFilter from './components/TodoFilter';
import TodoFooter from './components/TodoFooter';
import { loadTasks, saveTasks, isLocalStorageAvailable } from './utils/localStorage';
import './App.css';

/**
 * PUBLIC_INTERFACE
 * Main App component for Retro-Themed To-Do List application
 */
function App() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [storageAvailable, setStorageAvailable] = useState(true);

  /**
   * Load tasks from localStorage on mount
   */
  useEffect(() => {
    const available = isLocalStorageAvailable();
    setStorageAvailable(available);
    
    if (available) {
      const loadedTasks = loadTasks();
      setTasks(loadedTasks);
    } else {
      console.warn('localStorage not available - tasks will not persist');
    }
  }, []);

  /**
   * Save tasks to localStorage whenever tasks change
   */
  useEffect(() => {
    if (storageAvailable && tasks.length >= 0) {
      saveTasks(tasks);
    }
  }, [tasks, storageAvailable]);

  /**
   * PUBLIC_INTERFACE
   * Add a new task
   * @param {string} title - The task title
   */
  const addTask = (title) => {
    const newTask = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      title: title,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  /**
   * PUBLIC_INTERFACE
   * Toggle task completion status
   * @param {string} taskId - The ID of the task to toggle
   */
  const toggleTaskComplete = (taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  /**
   * PUBLIC_INTERFACE
   * Edit task title
   * @param {string} taskId - The ID of the task to edit
   * @param {string} newTitle - The new title for the task
   */
  const editTask = (taskId, newTitle) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, title: newTitle } : task
      )
    );
  };

  /**
   * PUBLIC_INTERFACE
   * Delete a task
   * @param {string} taskId - The ID of the task to delete
   */
  const deleteTask = (taskId) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  /**
   * PUBLIC_INTERFACE
   * Clear all completed tasks
   */
  const clearCompleted = () => {
    setTasks((prevTasks) => prevTasks.filter((task) => !task.completed));
  };

  /**
   * PUBLIC_INTERFACE
   * Change the active filter
   * @param {string} newFilter - The filter to apply ("all" | "active" | "completed")
   */
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  /**
   * Get filtered tasks based on current filter
   */
  const getFilteredTasks = () => {
    switch (filter) {
      case 'active':
        return tasks.filter((task) => !task.completed);
      case 'completed':
        return tasks.filter((task) => task.completed);
      default:
        return tasks;
    }
  };

  // Calculate task counts
  const totalCount = tasks.length;
  const activeCount = tasks.filter((task) => !task.completed).length;
  const completedCount = tasks.filter((task) => task.completed).length;

  const filteredTasks = getFilteredTasks();

  return (
    <div className="App">
      <div className="app-container">
        <header className="app-header">
          <h1 className="app-title">Retro To-Do List</h1>
          <p className="app-subtitle">Keep it simple, keep it retro</p>
        </header>

        {!storageAvailable && (
          <div className="warning-message">
            ⚠️ localStorage unavailable - tasks won't persist across sessions
          </div>
        )}

        <main className="app-main">
          <TodoInput onAddTask={addTask} />
          
          <TodoFilter
            currentFilter={filter}
            onFilterChange={handleFilterChange}
          />
          
          <TodoList
            tasks={filteredTasks}
            onToggle={toggleTaskComplete}
            onEdit={editTask}
            onDelete={deleteTask}
          />
          
          {totalCount > 0 && (
            <TodoFooter
              totalCount={totalCount}
              activeCount={activeCount}
              completedCount={completedCount}
              onClearCompleted={clearCompleted}
            />
          )}
        </main>

        <footer className="app-footer">
          <p>© 2026 Retro To-Do List • Made with ❤️ and nostalgia</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
