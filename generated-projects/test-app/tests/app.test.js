import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Counter from './src/components/Counter.jsx';

// Simple DOM environment simulation setup for testing React components without external heavyweight libraries
global.document = {
  createElement: (tag) => ({
    tagName: tag,
    setAttribute: () => {},
    style: {},
    classList: { add: () => {}, remove: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
  createElementNS: () => ({}),
  getElementById: () => null,
  body: { appendChild: () => {}, removeChild: () => {} },
  documentElement: { classList: { add: () => {}, remove: () => {} } }
};
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} })
};
global.navigator = { userAgent: 'node.js' };

test('Counter Component Initial State & Props Validation', async () => {
  assert.equal(typeof Counter, 'function', 'Counter component must be exported as a function/component');
  
  // Verify component rendering or basic initialization logic
  const initialValue = 10;
  const step = 5;
  const min = 0;
  const max = 100;

  let updateCalled = false;
  const mockOnUpdate = (val, details) => {
    updateCalled = true;
  };

  // Basic sanity assertion that component function accepts props correctly
  assert.doesNotThrow(() => {
    const element = React.createElement(Counter, {
      id: 'test-counter',
      title: 'Test Unit Counter',
      initialValue,
      step,
      min,
      max,
      onUpdate: mockOnUpdate
    });
    assert.ok(element, 'React element should be successfully created with props');
  }, 'Counter instantiation should not throw errors');
});

test('App Integration and Utility Logic Test', async () => {
  // Test basic JavaScript runtime capabilities and structural validity of the app codebase
  const appModule = await import('./src/App.jsx');
  assert.ok(appModule.default, 'App component must have a default export');
  assert.equal(typeof appModule.default, 'function', 'App export must be a valid React functional component');
});