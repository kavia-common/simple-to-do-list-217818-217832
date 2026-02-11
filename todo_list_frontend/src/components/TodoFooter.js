import React from 'react';
import './TodoFooter.css';

/**
 * PUBLIC_INTERFACE
 * TodoFooter component displaying task statistics and clear button
 * @param {number} totalCount - Total number of tasks
 * @param {number} activeCount - Number of incomplete tasks
 * @param {number} completedCount - Number of completed tasks
 * @param {Function} onClearCompleted - Callback to clear all completed tasks
 */
const TodoFooter = ({ totalCount, activeCount, completedCount, onClearCompleted }) => {
  return (
    <div className="todo-footer">
      <div className="task-counts" aria-live="polite">
        <span className="count-item">
          <strong>{totalCount}</strong> {totalCount === 1 ? 'task' : 'tasks'} total
        </span>
        <span className="count-divider">•</span>
        <span className="count-item">
          <strong>{activeCount}</strong> active
        </span>
        <span className="count-divider">•</span>
        <span className="count-item">
          <strong>{completedCount}</strong> completed
        </span>
      </div>
      
      {completedCount > 0 && (
        <button
          className="clear-completed-btn"
          onClick={onClearCompleted}
          aria-label="Clear all completed tasks"
        >
          Clear Completed
        </button>
      )}
    </div>
  );
};

export default TodoFooter;
