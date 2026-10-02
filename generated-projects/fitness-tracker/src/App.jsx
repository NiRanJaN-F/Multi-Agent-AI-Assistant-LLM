import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ExerciseForm from './components/ExerciseForm';
import ExerciseList from './components/ExerciseList';
import WeeklyCharts from './components/WeeklyCharts';
import { 
  getStoredExercises, 
  saveExercises, 
  getStoredProfile, 
  saveProfile, 
  getStoredGoals, 
  saveGoals 
} from './utils/storage';

export default function App() {
  const [exercises, setExercises] = useState([]);
  const [profile, setProfile] = useState({ name: 'Athlete', weight: 70, height: 175 });
  const [goals, setGoals] = useState({ calorieGoal: 2500, activeMinutesGoal: 60, waterGoal: 3000 });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setExercises(getStoredExercises());
    setProfile(getStoredProfile());
    setGoals(getStoredGoals());
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleAddExercise = (newEx) => {
    const updated = [newEx, ...exercises];
    setExercises(updated);
    saveExercises(updated);
    showToast(`Logged ${newEx.name} successfully! (+${newEx.caloriesBurned} kcal)`);
  };

  const handleDeleteExercise = (id) => {
    const updated = exercises.filter(ex => ex.id !== id);
    setExercises(updated);
    saveExercises(updated);
    showToast('Exercise removed.');
  };

  const handleUpdateGoals = (newGoals) => {
    setGoals(newGoals);
    saveGoals(newGoals);
    showToast('Fitness goals updated!');
  };

  const handleUpdateProfile = (newProfile) => {
    setProfile(newProfile);
    saveProfile(newProfile);
    setIsEditingProfile(false);
    showToast('Profile updated!');
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysExercises = exercises.filter(ex => ex.date === todayStr);

  const totalCaloriesBurned = todaysExercises.reduce((acc, curr) => acc + Number(curr.caloriesBurned || 0), 0);
  const totalDuration = todaysExercises.reduce((acc, curr) => acc + Number(curr.duration || 0), 0);
  const totalWorkouts = todaysExercises.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-cyan-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-cyan-500/90 text-slate-950 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md font-medium flex items-center gap-3 border border-cyan-400 animate-bounce">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <Header 
        profile={profile} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenProfile={() => setIsEditingProfile(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 px-6 font-semibold text-sm transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`py-3 px-6 font-semibold text-sm transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'log'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Log Workout
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-6 font-semibold text-sm transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Workout History ({exercises.length})
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`py-3 px-6 font-semibold text-sm transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'charts'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Weekly Analytics
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            <Dashboard 
              totalCaloriesBurned={totalCaloriesBurned}
              totalDuration={totalDuration}
              totalWorkouts={totalWorkouts}
              goals={goals}
              onUpdateGoals={handleUpdateGoals}
              todaysExercises={todaysExercises}
              onQuickLog={() => setActiveTab('log')}
            />
          </div>
        )}

        {activeTab === 'log' && (
          <div className="max-w-2xl mx-auto animate-fadeIn">
            <ExerciseForm 
              onAddExercise={handleAddExercise} 
              onCancel={() => setActiveTab('dashboard')} 
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-fadeIn">
            <ExerciseList 
              exercises={exercises} 
              onDeleteExercise={handleDeleteExercise} 
              onAddNew={() => setActiveTab('log')}
            />
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="animate-fadeIn">
            <WeeklyCharts exercises={exercises} goals={goals} />
          </div>
        )}

      </main>

      {/* Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-slate-100">Edit Athlete Profile</h3>
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="text-slate-400 hover:text-slate-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleUpdateProfile({
                  name: formData.get('name'),
                  weight: Number(formData.get('weight')),
                  height: Number(formData.get('height'))
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Athlete Name</label>
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={profile.name} 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Weight (kg)</label>
                  <input 
                    type="number" 
                    name="weight" 
                    defaultValue={profile.weight} 
                    required
                    min="30" 
                    max="300"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Height (cm)</label>
                  <input 
                    type="number" 
                    name="height" 
                    defaultValue={profile.height} 
                    required
                    min="100" 
                    max="250"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:brightness-110 transition-all shadow-lg shadow-cyan-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-6 text-center text-sm text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse"></div>
            <span className="font-semibold text-slate-400">PulseFit Pro v2.4</span>
          </div>
          <p>© {new Date().getFullYear()} PulseFit Fitness Tracker. Built with React & TailwindCSS.</p>
        </div>
      </footer>
    </div>
  );
}