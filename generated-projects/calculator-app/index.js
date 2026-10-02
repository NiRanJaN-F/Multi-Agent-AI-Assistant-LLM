// index.js

// Import necessary modules
import React from 'react';
import ReactDOM from 'react-dom';
import './styles.css';
import App from './app.js';

// Function to handle button click
function handleClick(event) {
  const buttonValue = event.target.value;
  const result = calculateResult(buttonValue);
  document.getElementById('result').textContent = result;
}

// Function to calculate the result based on the button value
function calculateResult(value) {
  const currentResult = document.getElementById('result').textContent;
  let result = currentResult;

  switch (value) {
    case '+':
      result = parseFloat(currentResult) + parseFloat(document.getElementById('input').value);
      break;
    case '-':
      result = parseFloat(currentResult) - parseFloat(document.getElementById('input').value);
      break;
    case '*':
      result = parseFloat(currentResult) * parseFloat(document.getElementById('input').value);
      break;
    case '/':
      result = parseFloat(currentResult) / parseFloat(document.getElementById('input').value);
      break;
    default:
      result = document.getElementById('input').value;
  }

  // Store the result in localStorage
  localStorage.setItem('result', result);

  return result;
}

// Function to load the result from localStorage on page load
function loadResult() {
  const storedResult = localStorage.getItem('result');
  if (storedResult) {
    document.getElementById('result').textContent = storedResult;
  }
}

// Main function to render the app
function main() {
  loadResult();
  ReactDOM.render(<App />, document.getElementById('root'));
}

// Event listener for button clicks
document.querySelectorAll('.button').forEach(button => {
  button.addEventListener('click', handleClick);
});

// Call the main function
main();