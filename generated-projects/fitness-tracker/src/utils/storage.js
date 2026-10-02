// LocalStorage keys
const EXERCISES_KEY = 'pulsefit_exercises';
const PROFILE_KEY = 'pulsefit_profile';
const GOALS_KEY = 'pulsefit_goals';

// Initial Mock Data for robust first-time experience
const INITIAL_EXERCISES = [
  {
    id: 'ex-1',
    name: 'Morning Run',
    category: 'Cardio',
    duration: 30,
    calories: 320,
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], // 2 days ago
    intensity: 'High'
  },
  {
    id: 'ex-2',
    name: 'Full Body Strength',
    category: 'Strength',
    duration: 45,
    calories: 280,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    intensity: 'Medium'
  },
  {
    id: 'ex-3',
    name: 'Vinyasa Flow Yoga',
    category: 'Flexibility',
    duration: 60,
    calories: 180,
    date: new Date().toISOString().split('T')[0], // Today
    intensity: 'Low'
  },
  {
    id: 'ex-4',
    name: 'HIIT Circuit',
    category: 'HIIT',
    duration: 25,
    calories: 310,
    date: new Date().toISOString().split('T')[0], // Today
    intensity: 'High'
  },
  {
    id: 'ex-5',
    name: 'Evening Jog',
    category: 'Cardio',
    duration: 40,
    calories: 410,
    date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], // 3 days ago
    intensity: 'Medium'
  }
];

const INITIAL_PROFILE = {
  name: 'Alex Morgan',
  age: 28,
  weight: 70, // kg
  height: 175, // cm
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
};

const INITIAL_GOALS = {
  dailyCalories: 500,
  dailyActiveMinutes: 45,
  weeklyWorkouts: 5
};

// --- Exercise Storage ---

export function getStoredExercises() {
  try {
    const data = localStorage.getItem(EXERCISES_KEY);
    if (!data) {
      localStorage.setItem(EXERCISES_KEY, JSON.stringify(INITIAL_EXERCISES));
      return INITIAL_EXERCISES;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load exercises from localStorage:', err);
    return INITIAL_EXERCISES;
  }
}

export function saveExercises(exercises) {
  try {
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));
  } catch (err) {
    console.error('Failed to save exercises to localStorage:', err);
  }
}

// --- Profile Storage ---

export function getStoredProfile() {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (!data) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(INITIAL_PROFILE));
      return INITIAL_PROFILE;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load profile from localStorage:', err);
    return INITIAL_PROFILE;
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile to localStorage:', err);
  }
}

// --- Goals Storage ---

export function getStoredGoals() {
  try {
    const data = localStorage.getItem(GOALS_KEY);
    if (!data) {
      localStorage.setItem(GOALS_KEY, JSON.stringify(INITIAL_GOALS));
      return INITIAL_GOALS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load goals from localStorage:', err);
    return INITIAL_GOALS;
  }
}

export function saveGoals(goals) {
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  } catch (err) {
    console.error('Failed to save goals to localStorage:', err);
  }
}