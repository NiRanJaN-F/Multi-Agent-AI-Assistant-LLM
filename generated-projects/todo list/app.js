import React from 'react';
import ReactDOM from 'react-dom';
import TodoList from './components/TodoList';
import './styles.css';

function App() {
  return (
    <div className="App">
      <h1>Todo List</h1>
      <TodoList />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);