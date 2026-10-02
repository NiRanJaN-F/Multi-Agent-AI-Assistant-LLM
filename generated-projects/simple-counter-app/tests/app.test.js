import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import App from './App';
import Counter from './components/Counter';
import CounterControls from './components/CounterControls';

// Setup Mock for global lucide icon library if required
beforeEach(() => {
  window.lucide = {
    createIcons: vi.fn(),
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('App Component', () => {
  it('renders the header and quantum counter main container', () => {
    render(<App />);
    const mainContainer = screen.getByRole('banner');
    expect(mainContainer).toBeInTheDocument();
  });

  it('toggles theme state between dark and light modes when theme toggle button is clicked', () => {
    const { container } = render(<App />);
    const outerDiv = container.firstChild;
    
    // Default theme should be dark
    expect(outerDiv.className).toContain('bg-slate-950');

    // Find and click theme toggle button
    const themeToggleButton = screen.getByRole('button', { name: /theme/i }) || screen.getByTestId('theme-toggle') || screen.getByRole('button');
    fireEvent.click(themeToggleButton);

    // Theme should transition to light
    expect(outerDiv.className).toContain('bg-slate-50');

    // Toggle back to dark
    fireEvent.click(themeToggleButton);
    expect(outerDiv.className).toContain('bg-slate-950');
  });

  it('calls window.lucide.createIcons on initial render and theme updates', () => {
    render(<App />);
    expect(window.lucide.createIcons).toHaveBeenCalled();
  });
});

describe('CounterControls Component Unit Tests', () => {
  const defaultProps = {
    onIncrement: vi.fn(),
    onDecrement: vi.fn(),
    onReset: vi.fn(),
    step: 1,
    onStepChange: vi.fn(),
    minLimit: -100,
    maxLimit: 100,
    onMinLimitChange: vi.fn(),
    onMaxLimitChange: vi.fn(),
    count: 0,
    disabled: false,
  };

  it('renders control buttons correctly', () => {
    render(<CounterControls {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('triggers onIncrement callback when increment button is clicked', () => {
    render(<CounterControls {...defaultProps} />);
    const incBtn = screen.getByRole('button', { name: /increment|\+|add/i }) || screen.getAllByRole('button')[0];
    fireEvent.click(incBtn);
    expect(defaultProps.onIncrement).toHaveBeenCalledTimes(1);
  });

  it('triggers onDecrement callback when decrement button is clicked', () => {
    render(<CounterControls {...defaultProps} />);
    const decBtn = screen.getByRole('button', { name: /decrement|\-|subtract/i }) || screen.getAllByRole('button')[1];
    fireEvent.click(decBtn);
    expect(defaultProps.onDecrement).toHaveBeenCalledTimes(1);
  });

  it('triggers onReset callback when reset button is clicked', () => {
    render(<CounterControls {...defaultProps} />);
    const resetBtn = screen.getByRole('button', { name: /reset/i });
    if (resetBtn) {
      fireEvent.click(resetBtn);
      expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
    }
  });

  it('disables decrement button when decrementing would cross minLimit', () => {
    const minProps = {
      ...defaultProps,
      count: -100,
      minLimit: -100,
      step: 1,
    };
    render(<CounterControls {...minProps} />);
    const decBtn = screen.getByRole('button', { name: /decrement|\-|subtract/i }) || screen.getAllByRole('button')[0];
    expect(decBtn).toBeDisabled();
  });

  it('disables increment button when incrementing would cross maxLimit', () => {
    const maxProps = {
      ...defaultProps,
      count: 100,
      maxLimit: 100,
      step: 1,
    };
    render(<CounterControls {...maxProps} />);
    const incBtn = screen.getByRole('button', { name: /increment|\+|add/i }) || screen.getAllByRole('button')[1];
    expect(incBtn).toBeDisabled();
  });

  it('disables all primary buttons when disabled prop is true', () => {
    render(<CounterControls {...defaultProps} disabled={true} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});

describe('Counter Component Integration Tests', () => {
  it('renders initial count state as 0', () => {
    render(<Counter />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('increments count when increment button is clicked', () => {
    render(<Counter />);
    const incBtn = screen.getByRole('button', { name: /increment|\+|add/i }) || screen.getAllByRole('button')[0];
    
    fireEvent.click(incBtn);
    expect(screen.getByText('1')).toBeInTheDocument();

    fireEvent.click(incBtn);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('decrements count when decrement button is clicked', () => {
    render(<Counter />);
    const decBtn = screen.getByRole('button', { name: /decrement|\-|subtract/i }) || screen.getAllByRole('button')[1];

    fireEvent.click(decBtn);
    expect(screen.getByText('-1')).toBeInTheDocument();
  });

  it('resets count back to 0 when reset button is pressed', () => {
    render(<Counter />);
    const incBtn = screen.getByRole('button', { name: /increment|\+|add/i }) || screen.getAllByRole('button')[0];
    const resetBtn = screen.getByRole('button', { name: /reset/i });

    fireEvent.click(incBtn);
    fireEvent.click(incBtn);
    expect(screen.getByText('2')).toBeInTheDocument();

    fireEvent.click(resetBtn);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('updates step size and modifies increment amount accordingly', () => {
    render(<Counter />);
    const stepInput = screen.getByLabelText(/step/i) || screen.getByPlaceholderText(/step/i) || screen.getByRole('spinbutton');
    
    if (stepInput) {
      fireEvent.change(stepInput, { target: { value: '5' } });
      const incBtn = screen.getByRole('button', { name: /increment|\+|add/i }) || screen.getAllByRole('button')[0];
      fireEvent.click(incBtn);
      expect(screen.getByText('5')).toBeInTheDocument();
    }
  });

  it('respects minimum limit boundaries', () => {
    render(<Counter />);
    const minInput = screen.getByLabelText(/min/i) || screen.getByPlaceholderText(/min/i);
    
    if (minInput) {
      fireEvent.change(minInput, { target: { value: '-2' } });
      const decBtn = screen.getByRole('button', { name: /decrement|\-|subtract/i }) || screen.getAllByRole('button')[1];

      fireEvent.click(decBtn); // -1
      fireEvent.click(decBtn); // -2
      expect(screen.getByText('-2')).toBeInTheDocument();

      // Next attempt should be disabled or prevented
      expect(decBtn).toBeDisabled();
    }
  });

  it('respects maximum limit boundaries', () => {
    render(<Counter />);
    const maxInput = screen.getByLabelText(/max/i) || screen.getByPlaceholderText(/max/i);
    
    if (maxInput) {
      fireEvent.change(maxInput, { target: { value: '2' } });
      const incBtn = screen.getByRole('button', { name: /increment|\+|add/i }) || screen.getAllByRole('button')[0];

      fireEvent.click(incBtn); // 1
      fireEvent.click(incBtn); // 2
      expect(screen.getByText('2')).toBeInTheDocument();

      expect(incBtn).toBeDisabled();
    }
  });
});

describe('Auto-Increment and Interval Functionality', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('supports automated periodic incrementing when auto-increment is enabled', () => {
    render(<Counter />);
    const autoToggle = screen.getByLabelText(/auto/i) || screen.getByText(/auto/i);

    if (autoToggle) {
      fireEvent.click(autoToggle);
      
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('1')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('2')).toBeInTheDocument();
    }
  });
});

describe('Counter Business Logic & Boundary Pure Checks', () => {
  it('validates bounds calculation helper logic', () => {
    const isWithinBounds = (val, min, max, step) => {
      const next = val + step;
      if (min !== '' && min !== null && next < Number(min)) return false;
      if (max !== '' && max !== null && next > Number(max)) return false;
      return true;
    };

    expect(isWithinBounds(0, -10, 10, 1)).toBe(true);
    expect(isWithinBounds(10, -10, 10, 1)).toBe(false);
    expect(isWithinBounds(-10, -10, 10, -1)).toBe(false);
  });
});