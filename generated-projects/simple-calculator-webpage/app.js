// app.js

document.addEventListener('DOMContentLoaded', () => {
  const calculator = {
    display: document.getElementById('display'),
    buttons: document.querySelectorAll('.button'),
    clearDisplay: () => calculator.display.value = '',
    evaluateExpression: () => {
      try {
        calculator.display.value = eval(calculator.display.value);
      } catch (error) {
        calculator.display.value = 'Error';
      }
    },
    handleButtonClick: (event) => {
      const button = event.target;
      const value = button.textContent;

      if (value === 'C') {
        calculator.clearDisplay();
      } else if (value === '=') {
        calculator.evaluateExpression();
      } else {
        calculator.display.value += value;
      }
    }
  };

  calculator.buttons.forEach(button => {
    button.addEventListener('click', calculator.handleButtonClick);
  });

  // Add color to buttons
  calculator.buttons.forEach(button => {
    button.style.backgroundColor = '#4CAF50'; // Green
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.padding = '10px 20px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '16px';
  });
});