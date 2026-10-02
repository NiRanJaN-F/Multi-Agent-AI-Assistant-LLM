import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import components and services
import Navbar from './src/components/Navbar';
import WorkoutForm from './src/components/WorkoutForm';
import WorkoutList from './src/components/WorkoutList';
import * as api from './src/services/api';

// ==========================================
// MOCK API MODULE
// ==========================================
test('API Service Integration Mocks', async () => {
  const mockWorkouts = [
    { id: 1, exercise: 'Running', duration: 30, calories: 300, date: '2023-10-01' }
  ];

  // Mock global fetch
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    if (url.includes('/api/workouts') && (!options || options.method === 'GET')) {
      return {
        ok: true,
        json: async () => mockWorkouts
      };
    }
    if (options && options.method === 'POST') {
      const body = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ id: 2, ...body })
      };
    }
    if (options && options.method === 'DELETE') {
      return {
        ok: true,
        json: async () => ({ message: 'Deleted successfully' })
      };
    }
    return { ok: false };
  };

  const workouts = await api.getWorkouts();
  assert.equal(workouts.length, 1);
  assert.equal(workouts[0].exercise, 'Running');

  const newWorkout = await api.createWorkout({ exercise: 'Cycling', duration: 45, calories: 400, date: '2023-10-02' });
  assert.equal(newWorkout.id, 2);
  assert.equal(newWorkout.exercise, 'Cycling');

  const deleteRes = await api.deleteWorkout(1);
  assert.equal(deleteRes.message, 'Deleted successfully');

  global.fetch = originalFetch;
});

// ==========================================
// COMPONENT UNIT TESTS
// ==========================================

test('Navbar Component renders title and tabs correctly', () => {
  const setActiveTab = () => {};
  render(
    <Navbar 
      activeTab="dashboard" 
      setActiveTab={setActiveTab} 
      totalWorkouts={5} 
      totalCalories={1500} 
    />
  );

  const brandElement = screen.getByText(/ApexFit/i);
  assert.ok(brandElement, 'Navbar should display ApexFit brand name');

  const workoutsBadge = screen.getByText('5');
  assert.ok(workoutsBadge, 'Navbar should show total workouts');
});

test('WorkoutForm Component validates inputs and submits data', async () => {
  let submittedData = null;
  const onSubmitMock = async (data) => {
    submittedData = data;
  };

  render(<WorkoutForm onAddWorkout={onSubmitMock} onClose={() => {}} />);

  const exerciseInput = screen.getByLabelText(/Exercise Name/i);
  const durationInput = screen.getByLabelText(/Duration/i);
  const caloriesInput = screen.getByLabelText(/Calories Burned/i);
  const submitButton = screen.getByRole('button', { name: /Add Workout/i });

  fireEvent.change(exerciseInput, { target: { value: 'Pushups' } });
  fireEvent.change(durationInput, { target: { value: '20' } });
  fireEvent.change(caloriesInput, { target: { value: '150' } });

  fireEvent.click(submitButton);

  await waitFor(() => {
    assert.deepEqual(submittedData, {
      exercise: 'Pushups',
      duration: 20,
      calories: 150,
      date: new Date().toISOString().split('T')[0]
    });
  });
});

test('WorkoutList Component renders workouts and handles deletion', () => {
  const mockWorkouts = [
    { id: 10, exercise: 'Swimming', duration: 45, calories: 400, date: '2023-10-05' }
  ];
  let deletedId = null;
  const onDeleteMock = (id) => {
    deletedId = id;
  };

  render(<WorkoutList workouts={mockWorkouts} onDeleteWorkout={onDeleteMock} />);

  const exerciseItem = screen.getByText(/Swimming/i);
  assert.ok(exerciseItem, 'Workout list should render the exercise item');

  const deleteButton = screen.getByRole('button', { name: /delete/i });
  fireEvent.click(deleteButton);

  assert.equal(deletedId, 10, 'Clicking delete should trigger deletion callback with correct ID');
});