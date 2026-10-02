import React, { useState } from 'react';
import TodoItem from './TodoItem';
import './styles.css';

const TodoList = () => {
  const [tasks, setTasks] = useState([]);

  const addTask = (task) => {
    setTasks([...tasks, task]);
  };

  const completeTask = (index) => {
    const updatedTasks = [...tasks];
    updatedTasks[index].completed = true;
    setTasks(updatedTasks);
  };

  const deleteTask = (index) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
  };

  return (
    <div className="todo-list">
      <h1>Todo List</h1>
      <input
        type="text"
        placeholder="Add a new task"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            addTask(e.target.value);
            e.target.value = '';
          }
        }}
      />
      <ul>
        {tasks.map((task, index) => (
          <TodoItem
            key={index}
            task={task}
            completeTask={() => completeTask(index)}
            deleteTask={() => deleteTask(index)}
          />
        ))}
      </ul>
    </div>
  );
};

export default TodoList;