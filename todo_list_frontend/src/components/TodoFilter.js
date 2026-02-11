import React from 'react';
import './TodoFilter.css';

/**
 * PUBLIC_INTERFACE
 * TodoFilter component for filtering tasks by status
 * @param {string} currentFilter - Current active filter ("all" | "active" | "completed")
 * @param {Function} onFilterChange - Callback when filter changes
 */
const TodoFilter = ({ currentFilter, onFilterChange }) => {
  const filters = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' }
  ];

  return (
    <div className="todo-filter">
      {filters.map((filter) => (
        <button
          key={filter.key}
          className={`filter-btn ${currentFilter === filter.key ? 'active' : ''}`}
          onClick={() => onFilterChange(filter.key)}
          aria-label={`Show ${filter.label} tasks`}
          aria-pressed={currentFilter === filter.key}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default TodoFilter;
