// Import necessary dependencies
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

// Import necessary components
import Main from './components/Main';

// Import necessary styles
import './styles/styles.css';

// Set up the main component
function App() {
  // Get the history object to navigate between routes
  const history = useHistory();

  // Set up the state for the workout name and exercises
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState([]);

  // Fetch the workout data from localStorage on mount
  useEffect(() => {
    const savedWorkout = localStorage.getItem('workout');
    if (savedWorkout) {
      const parsedWorkout = JSON.parse(savedWorkout);
      setWorkoutName(parsedWorkout.name);
      setExercises(parsedWorkout.exercises);
    }
  }, []);

  // Handle form submission to create a new workout
  const handleSubmit = (e) => {
    e.preventDefault();
    const workoutData = {
      name: workoutName,
      exercises: exercises,
    };
    localStorage.setItem('workout', JSON.stringify(workoutData));
    history.push('/');
  };

  // Handle form submission to add an exercise to the workout
  const handleExerciseSubmit = (exercise) => {
    const workoutData = JSON.parse(localStorage.getItem('workout'));
    workoutData.exercises.push(exercise);
    localStorage.setItem('workout', JSON.stringify(workoutData));
  };

  return (
    <div className="App">
      <h1>Workout Tracker</h1>
      <main className="main">
        <h2>Workout Details</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="workout-name">Workout Name:</label>
          <input type="text" id="workout-name" value={workoutName} onChange={(e) => setWorkoutName(e.target.value)} />
          <button type="submit">Save Workout</button>
        </form>

        <h2>Workout Exercises</h2>
        {exercises.map((exercise, index) => (
          <div key={index}>
            <h3>Exercise {index + 1}. {exercise}</h3>
            <form onSubmit={(e) => handleExerciseSubmit(exercise)}>
              <label htmlFor="exercise-name">Exercise Name:</label>
              <input type="text" id="exercise-name" value={exercise} onChange={(e) => handleExerciseSubmit(e.target.value)} />
              <button type="submit">Save Exercise</button>
            </form>
          </div>
        ))}
      </main>
    </div>
  );
}

export default App;