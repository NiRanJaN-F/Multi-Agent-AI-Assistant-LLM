// tests/app.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// -------------------------------------------------------------------
// Import the Calculator class from the source file.
// The source file must export the class, e.g.:
//   module.exports = { Calculator };
//
const { Calculator } = require('../app.js');

// -------------------------------------------------------------------
// Unit tests for the Calculator class
// -------------------------------------------------------------------
test('Calculator initializes with default state', () => {
  const calc = new Calculator();
  assert.strictEqual(calc.currentOperand, '');
  assert.strictEqual(calc.previousOperand, '');
  assert.strictEqual(calc.operation, undefined);
});

test('appendNumber builds the current operand', () => {
  const calc = new Calculator();
  calc.appendNumber('5');
  calc.appendNumber('3');
  assert.strictEqual(calc.currentOperand, '53');
});

test('appendNumber prevents multiple decimals', () => {
  const calc = new Calculator();
  calc.appendNumber('3');
  calc.appendNumber('.');
  calc.appendNumber('1');
  calc.appendNumber('.');
  assert.strictEqual(calc.currentOperand, '3.1');
});

test('chooseOperation moves current to previous and sets operation', () => {
  const calc = new Calculator();
  calc.appendNumber('8');
  calc.chooseOperation('+');
  assert.strictEqual(calc.previousOperand, '8');
  assert.strictEqual(calc.operation, '+');
  assert.strictEqual(calc.currentOperand, '');
});

test('compute performs addition correctly', () => {
  const calc = new Calculator();
  calc.appendNumber('12');
  calc.chooseOperation('+');
  calc.appendNumber('7');
  calc.compute();
  assert.strictEqual(calc.currentOperand, '19');
  assert.strictEqual(calc.operation, undefined);
  assert.strictEqual(calc.previousOperand, '');
});

test('compute performs subtraction, multiplication, and division', () => {
  const calc = new Calculator();

  // subtraction
  calc.appendNumber('10');
  calc.chooseOperation('-');
  calc.appendNumber('4');
  calc.compute();
  assert.strictEqual(calc.currentOperand, '6');

  // multiplication
  calc.chooseOperation('×');
  calc.appendNumber('3');
  calc.compute();
  assert.strictEqual(calc.currentOperand, '18');

  // division
  calc.chooseOperation('÷');
  calc.appendNumber('2');
  calc.compute();
  assert.strictEqual(calc.currentOperand, '9');
});

test('toggleSign flips sign of current operand', () => {
  const calc = new Calculator();
  calc.appendNumber('5');
  calc.toggleSign();
  assert.strictEqual(calc.currentOperand, '-5');
  calc.toggleSign();
  assert.strictEqual(calc.currentOperand, '5');
});

test('clear resets all state', () => {
  const calc = new Calculator();
  calc.appendNumber('9');
  calc.chooseOperation('×');
  calc.appendNumber('2');
  calc.clear();
  assert.strictEqual(calc.currentOperand, '');
  assert.strictEqual(calc.previousOperand, '');
  assert.strictEqual(calc.operation, undefined);
});

test('delete removes last character of the current operand', () => {
  const calc = new Calculator();
  calc.appendNumber('123');
  calc.delete();
  assert.strictEqual(calc.currentOperand, '12');
  calc.delete();
  calc.delete();
  assert.strictEqual(calc.currentOperand, '');
});

test('formatResult adds commas to large numbers', () => {
  const calc = new Calculator();
  const formatted = calc.formatResult('1234567.89');
  assert.strictEqual(formatted, '1,234,567.89');
});

// -------------------------------------------------------------------
// Integration test: verify package metadata
// -------------------------------------------------------------------
test('package.json contains correct metadata', () => {
  const pkgPath = path.resolve(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert.strictEqual(pkg.name, 'calculator-app');
  assert.strictEqual(pkg.version, '1.0.0');
});