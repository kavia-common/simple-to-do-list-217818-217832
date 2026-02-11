import React, { useState, useEffect, useRef } from 'react';
import './TodoItem.css';

/**
 * PUBLIC_INTERFACE
 * TodoItem component for displaying and interacting with a single task
 * @param {Object} task - Task object with id, title, completed properties
 * @param {Function} onToggle - Callback to toggle task completion
 * @param {Function} onEdit - Callback to edit task title
 * @param {Function} onDelete - Callback to delete task
 */
const TodoItem = ({ task, onToggle, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const inputRef = useRef(null);

  /**
   * Focus input when entering edit mode
   */
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  /**
   * Handle edit icon click
   */
  const handleEditClick = () => {
    setEditValue(task.title);
    setIsEditing(true);
  };

  /**
   * Save edited task
   */
  const handleSave = () => {
    const trimmedValue = editValue.trim();
    
    // Don't allow empty titles - revert to original
    if (trimmedValue === '') {
      setEditValue(task.title);
      setIsEditing(false);
      return;
    }

    // Only save if value changed
    if (trimmedValue !== task.title) {
      onEdit(task.id, trimmedValue);
    }
    
    setIsEditing(false);
  };

  /**
   * Cancel editing
   */
  const handleCancel = () => {
    setEditValue(task.title);
    setIsEditing(false);
  };

  /**
   * Handle keyboard events during editing
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  /**
   * Handle blur event (clicking outside)
   */
  const handleBlur = () => {
    handleSave();
  };

  return (
    <div className={`todo-item ${task.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        className="todo-checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />
      
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="todo-edit-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          maxLength={200}
          aria-label="Edit task title"
        />
      ) : (
        <span className="todo-title">{task.title}</span>
      )}

      <div className="todo-actions">
        {!isEditing && (
          <>
            <button
              className="todo-action-btn edit-btn"
              onClick={handleEditClick}
              aria-label={`Edit "${task.title}"`}
              title="Edit"
            >
              ✎
            </button>
            <button
              className="todo-action-btn delete-btn"
              onClick={() => onDelete(task.id)}
              aria-label={`Delete "${task.title}"`}
              title="Delete"
            >
              ✕
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TodoItem;
