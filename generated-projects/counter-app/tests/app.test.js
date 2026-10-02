const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
require('@testing-library/jest-dom');

// Mock Lucide icons to avoid rendering issues in test environment
jest.mock('lucide-react', () => ({
  Zap: () => React.createElement('span', { 'data-testid': 'icon-zap' }, 'Zap'),
  Plus: () => React.createElement('span', { 'data-testid': 'icon-plus' }, '+'),
  Minus: () => React.createElement('span', { 'data-testid': 'icon-minus' }, '-'),
  RotateCcw: () => React.createElement('span', { 'data-testid': 'icon-reset' }, 'Reset'),
  Play: () => React.createElement('span', { 'data-testid': 'icon-play' }, 'Play'),
  Pause: () => React.createElement('span', { 'data-testid': 'icon-pause' }, 'Pause'),
  TrendingUp: () => React.createElement('span', { 'data-testid': 'icon-trending' }, 'Trending'),
  History: () => React.createElement('span', { 'data-testid': 'icon-history' }, 'History'),
  Award: () => React.createElement('span', { 'data-testid': 'icon-award' }, 'Award'),
  Settings: () => React.createElement('span', { 'data-testid': 'icon-settings' }, 'Settings'),
  Volume2: () => React.createElement('span', { 'data-testid': 'icon-sound' }, 'Sound'),
  VolumeX: () => React.createElement('span', { 'data-testid': 'icon-mute' }, 'Mute'),
  Sparkles: () => React.createElement('span', { 'data-testid': 'icon-sparkles' }, 'Sparkles'),
  Trash2: () => React.createElement('span', { 'data-testid': 'icon-trash' }, 'Trash'),
  CheckCircle2: () => React.createElement('span', { 'data-testid': 'icon-check' }, 'Check'),
  Lock: () => React.createElement('span', { 'data-testid': 'icon-lock' }, 'Lock'),
  Unlock: () => React.createElement('span', { 'data-testid': 'icon-unlock' }, 'Unlock'),
  Copy: () => React.createElement('span', { 'data-testid': 'icon-copy' }, 'Copy'),
  HelpCircle: () => React.createElement('span', { 'data-testid': 'icon-help' }, 'Help')
}));

const App = require('../src/App').default;
const Counter = require('../src/components/Counter').default;

test('Counter App Unit & Integration Test Suite', async (t) => {
  
  await t.test('App component renders header and counter wrapper correctly', () => {
    render(React.createElement(App));
    
    const headerTitle = screen.getByText(/Quantum Counter/i);
    assert.ok(headerTitle, 'Header title should be present');
  });

  await t.test('Counter component renders initial state with 0 count', () => {
    render(React.createElement(Counter));
    
    // Check main display elements
    const countDisplay = screen.getByText('0');
    assert.ok(countDisplay, 'Initial count of 0 should be displayed');
  });

  await t.test('Increment button increases count by default step 1', () => {
    render(React.createElement(Counter));
    
    // Find increment button
    const incrementBtn = screen.getByRole('button', { name: /\+/i });
    fireEvent.click(incrementBtn);
    
    const countDisplay = screen.getByText('1');
    assert.ok(countDisplay, 'Count should increment to 1');
  });

  await t.test('Decrement button decreases count correctly', () => {
    render(React.createElement(Counter));
    
    const decrementBtn = screen.getByRole('button', { name: /-/i });
    fireEvent.click(decrementBtn);
    
    const countDisplay = screen.getByText('-1');
    assert.ok(countDisplay, 'Count should decrement to -1');
  });

  await t.test('Step change modifies the increment/decrement value', () => {
    render(React.createElement(Counter));
    
    // Click step 5 button
    const step5Btn = screen.getByRole('button', { name: '5' });
    fireEvent.click(step5Btn);
    
    // Increment
    const incrementBtn = screen.getByRole('button', { name: /\+/i });
    fireEvent.click(incrementBtn);
    
    const countDisplay = screen.getByText('5');
    assert.ok(countDisplay, 'Count should increase by step 5 to reach 5');
  });

  await t.test('Reset button resets the counter back to 0', () => {
    render(React.createElement(Counter));
    
    const incrementBtn = screen.getByRole('button', { name: /\+/i });
    fireEvent.click(incrementBtn);
    fireEvent.click(incrementBtn);
    
    assert.ok(screen.getByText('2'));
    
    const resetBtn = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetBtn);
    
    assert.ok(screen.getByText('0'), 'Count should reset back to 0');
  });

});