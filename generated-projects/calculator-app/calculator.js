// calculator.js

document.addEventListener('DOMContentLoaded', () => {
  const calculator = document.getElementById('calculator');
  const display = document.getElementById('display');
  const buttons = document.querySelectorAll('.button');

  let currentInput = '';
  let previousInput = '';
  let operator = '';

  // Function to update the display
  const updateDisplay = () => {
    display.value = currentInput;
  };

  // Function to handle button clicks
  const handleButtonClick = (event) => {
    const button = event.target;
    const value = button.textContent;

    if (value === 'C') {
      currentInput = '';
      previousInput = '';
      operator = '';
      updateDisplay();
    } else if (value === '=') {
      if (operator) {
        const result = eval(`${previousInput} ${operator} ${currentInput}`);
        currentInput = result.toString();
        previousInput = '';
        operator = '';
        updateDisplay();
      }
    } else if (['+', '-', '*', '/'].includes(value)) {
      if (currentInput) {
        previousInput = currentInput;
        operator = value;
        currentInput = '';
      }
    } else {
      currentInput += value;
      updateDisplay();
    }
  };

  // Function to handle keyboard input
  const handleKeyPress = (event) => {
    const key = event.key;
    if (key === 'Enter') {
      handleButtonClick({ target: document.getElementById('=') });
    } else if (key === 'Backspace') {
      currentInput = currentInput.slice(0, -1);
      updateDisplay();
    } else if (key.match(/[0-9+\-*/]/)) {
      handleButtonClick({ target: document.getElementById(key) });
    }
  };

  // Initialize event listeners
  buttons.forEach(button => button.addEventListener('click', handleButtonClick));
  window.addEventListener('keydown', handleKeyPress);

  // Load previous state from localStorage
  const savedState = localStorage.getItem('calculatorState');
  if (savedState) {
    const { currentInput, previousInput, operator } = JSON.parse(savedState);
    calculatorInput = currentInput;
    previousInput = previousInput;
    operator = operator;
    updateDisplay();
  }
});

// Save state to localStorage
window.addEventListener('beforeunload', () => {
  const state = { currentInput, previousInput, operator };
  localStorage.setItem('calculatorState', JSON.stringify(state));
});