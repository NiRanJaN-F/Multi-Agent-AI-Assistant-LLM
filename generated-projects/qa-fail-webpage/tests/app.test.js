// Test runner file
const assert = require('assert');
const { app } = require('./app');

describe('App Tests', () => {
  test('Test Form Submission', () => {
    const form = document.querySelector('form');
    const submitButton = document.querySelector('button[type="submit"]');

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const inputElements = form.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea');

      inputElements.forEach((inputElement) => {
        const value = inputElement.value;
        assert.equal(value, '', 'Input fields should be empty');
    });

    submitButton.click();
  });
});

test('Test Form Validation', () => {
  const form = document.querySelector('form');
  const formData = app.getFormData();

  assert.deepEqual(formData, {}, 'Form data should be empty');
});

test('Test Form Submission', () => {
  const form = document.querySelector('form');
  const submitButton = document.querySelector('button[type="submit"]');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const inputElements = form.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea');

    inputElements.forEach((inputElement) => {
      const value = inputElement.value;
      assert.equal(value, '', 'Input fields should be empty');
    });

    submitButton.click();
  });
});