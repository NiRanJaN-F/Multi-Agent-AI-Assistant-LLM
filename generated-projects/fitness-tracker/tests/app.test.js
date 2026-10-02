import test from 'node:test';
import assert from 'node:assert';

// We mock localStorage and browser environment globals to allow utility and component testing in Node.js
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  clear() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
}

global.localStorage = new LocalStorageMock();

// Storage utility verification
import { 
  getStoredExercises, 
  saveExercises, 
  getStoredProfile, 
  saveProfile, 
  getStoredGoals, 
  saveGoals 
} from './src/utils/storage.js';

test('Storage Utility - Exercises CRUD operations', () => {
  localStorage.clear();
  
  // Test initial default state
  const initial = getStoredExercises();
  assert.ok(Array.isArray(initial));
  
  // Test save and retrieve
  const sampleExercises = [
    { id: 1, name: 'Running', category: 'Cardio', caloriesBurned: 300, duration: 30, date: '2023-10-01' }
  ];
  saveExercises(sampleExercises);
  
  const retrieved = getStoredExercises();
  assert.strictEqual(retrieved.length, 1);
  assert.strictEqual(retrieved[0].name, 'Running');
  assert.strictEqual(retrieved[0].caloriesBurned, 300);
});

test('Storage Utility - Profile CRUD operations', () => {
  localStorage.clear();
  
  const defaultProfile = getStoredProfile();
  assert.ok(defaultProfile);
  assert.strictEqual(typeof defaultProfile.weight, 'number');
  
  const newProfile = { name: 'Test Athlete', weight: 75, height: 180 };
  saveProfile(newProfile);
  
  const retrievedProfile = getStoredProfile();
  assert.deepStrictEqual(retrievedProfile, newProfile);
});

test('Storage Utility - Goals CRUD operations', () => {
  localStorage.clear();
  
  const defaultGoals = getStoredGoals();
  assert.ok(defaultGoals);
  
  const newGoals = { calorieGoal: 3000, activeMinutesGoal: 90, waterGoal: 3500 };
  saveGoals(newGoals);
  
  const retrievedGoals = getStoredGoals();
  assert.deepStrictEqual(retrievedGoals, newGoals);
});

// Logic & Integration tests for Dashboard metric calculations
test('Dashboard Metric Calculations logic', () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const exercises = [
    { id: 1, name: 'Morning Jog', category: 'Cardio', caloriesBurned: 400, duration: 40, date: todayStr },
    { id: 2, name: 'Weightlifting', category: 'Strength', caloriesBurned: 250, duration: 50, date: todayStr },
    { id: 3, name: 'Old Workout', category: 'Cardio', caloriesBurned: 500, duration: 60, date: '2020-01-01' }
  ];

  const todayExercises = exercises.filter(ex => ex.date === todayStr);
  const totalCaloriesBurned = todayExercises.reduce((sum, ex) => sum + Number(ex.caloriesBurned), 0);
  const totalDuration = todayExercises.reduce((sum, ex) => sum + Number(ex.duration), 0);
  const workoutCount = todayExercises.length;

  assert.strictEqual(totalCaloriesBurned, 650);
  assert.strictEqual(totalDuration, 90);
  assert.strictEqual(workoutCount, 2);

  const calorieGoal = 2500;
  const caloriesRemaining = Math.max(0, calorieGoal - totalCaloriesBurned);
  assert.strictEqual(caloriesRemaining, 1850);
});

// Test filtering logic used in ExerciseList
test('Exercise Filtering and Search logic', () => {
  const exercises = [
    { id: 1, name: 'Outdoor Running', category: 'Cardio', caloriesBurned: 350, duration: 30, date: '2023-10-01' },
    { id: 2, name: 'Bench Press', category: 'Strength', caloriesBurned: 200, duration: 45, date: '2023-10-01' },
    { id: 3, name: 'Yoga Flow', category: 'Flexibility', caloriesBurned: 150, duration: 30, date: '2023-10-01' }
  ];

  // Filter by category
  const cardioExercises = exercises.filter(ex => ex.category === 'Cardio');
  assert.strictEqual(cardioExercises.length, 1);
  assert.strictEqual(cardioExercises[0].name, 'Outdoor Running');

  // Filter by search term
  const searchTerm = 'yoga';
  const searchedExercises = exercises.filter(ex => ex.name.toLowerCase().includes(searchTerm.toLowerCase()));
  assert.strictEqual(searchedExercises.length, 1);
  assert.strictEqual(searchedExercises[0].category, 'Flexibility');
});