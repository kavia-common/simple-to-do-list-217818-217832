import React from 'react';
import TodoItem from './TodoItem';
import './TodoList.css';

/**
 * PUBLIC_INTERFACE
 * TodoList component for displaying all tasks
 * @param {Array} tasks - Array of task objects
 * @param {Function} onToggle - Callback to toggle task completion
 * @param {Function} onEdit - Callback to edit task
 * @param {Function} onDelete - Callback to delete task
 */
const TodoList = ({ tasks, onToggle, onEdit, onDelete }) => {
  if (tasks.length === 0) {
    return (
      <div className="todo-list-empty">
        <p>No tasks yet! Add one above to get started.</p>
      </div>
    );
  }

  return (
    <div className="todo-list">
      {tasks.map((task) => (
        <TodoItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default TodoList;
