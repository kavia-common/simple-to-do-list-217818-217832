import React, { useState } from 'react';
import './TodoInput.css';

/**
 * PUBLIC_INTERFACE
 * TodoInput component for creating new tasks
 * @param {Function} onAddTask - Callback function to add a new task
 */
const TodoInput = ({ onAddTask }) => {
  const [inputValue, setInputValue] = useState('');
  const MAX_CHARS = 200;

  /**
   * Handle input change with character limit
   */
  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setInputValue(value);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedValue = inputValue.trim();
    
    // Validate: don't allow empty or whitespace-only tasks
    if (trimmedValue === '') {
      return;
    }

    onAddTask(trimmedValue);
    setInputValue(''); // Clear input after successful add
  };

  /**
   * Handle Enter key press
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="todo-input-container">
      <form onSubmit={handleSubmit} className="todo-input-form">
        <input
          type="text"
          className="todo-input"
          placeholder="What needs to be done?"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          maxLength={MAX_CHARS}
          aria-label="New task input"
        />
        <button 
          type="submit" 
          className="todo-add-btn"
          aria-label="Add task"
        >
          Add
        </button>
      </form>
      <div className="char-counter">
        {inputValue.length}/{MAX_CHARS}
      </div>
    </div>
  );
};

export default TodoInput;
