// Import necessary modules
const assert = require('assert');
const app = require('../app');

// Test functions
describe('Tip Calculator', () => {
  describe('#calculateTip()', () => {
    it('should return the correct tip amount when bill amount is 100, tip percentage is 15%, and number of people is 2', () => {
      // Setup
      const billAmount = 100;
      const tipPercentage = 15;
      const numOfPeople = 2;

      // Call the function and assert the result
      const tipAmountResult = app.calculateTip(billAmount, tipPercentage, numOfPeople);
      assert.equal(tipAmountResult, 15.25, 'Tip amount should be 15.25');
    });

    it('should return the correct total amount when bill amount is 100, tip percentage is 15%, and number of people is 2', () => {
      // Setup
      const billAmount = 100;
      const tipPercentage = 15;
      const numOfPeople = 2;

      // Call the function and assert the result
      const totalAmountResult = app.calculateTotal(billAmount, tipPercentage, numOfPeople);
      assert.equal(totalAmountResult, 125, 'Total amount should be 125');
    });

    it('should return the correct total amount when bill amount is 100, tip percentage is 15%, and number of people is 2', () => {
      // Setup
      const billAmount = 100;
      const tipPercentage = 15;
     const numOfPeople = 2;

     // Call the function and assert the result
     const totalAmountResult = app.calculateTotal(billAmount, tipPercentage, numOfPeople);
     assert.equal(totalAmountResult, 125, 'Total amount should be 125');
    });

    it('should return the correct total amount when bill amount is 100, tip percentage is 15%, and number of people is 2', () => {
      // Setup
      const billAmount = 100;
     const tipPercentage = 15;
     const numOfPeople = 2;

     // Call the function and assert the result
     const totalAmountResult = app.calculateTotal(billAmount, tipPercentage, numOfPeople);
     assert.equal(totalAmountResult, 125, 'Total amount should be 125');
    });

    it('should return the correct total amount when bill amount is 100, tip percentage is 15%, and number of people is 2', () => {
      // Setup
      const billAmount = 100;
     const tipPercentage = 15;
     const numOfPeople = 2;

     // Call the function and assert the result
     const totalAmountResult = app.calculateTotal(billAmount, tipPercentage, numOfPeople);
     assert.equal(totalAmountResult, 125, 'Total amount should be 125');
    });

    it('should return the correct total amount when bill amount is 100, tip percentage is 15%, and number of people is 2', () => {
      // Setup
      const billAmount = 100;
     const tipPercentage = 15;
     const numOfPeople = 2;

     // Call the function and assert the result
     const totalAmountResult = app.calculateTotal(billAmount, tipPercentage, numOfPeople);
     assert.equal(totalAmountResult, 125, 'Total amount should be 125');
    });
});

// Additional test cases can be added as needed for more comprehensive testing