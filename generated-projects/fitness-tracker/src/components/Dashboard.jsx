import React, { useState } from 'react';

export default function Dashboard({ exercises, profile, goals, onUpdateGoals }) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [calorieInput, setCalorieInput] = useState(goals.calorieGoal || 2500);

  // Calculate today's metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayExercises = exercises.filter(ex => ex.date === todayStr);

  const totalCaloriesBurned = todayExercises.reduce((sum, ex) => sum + Number(ex.caloriesBurned), 0);
  const totalDuration = todayExercises.reduce((sum, ex) => sum + Number(ex.duration), 0);
  const workoutCount = todayExercises.length;

  const calorieGoal = goals.calorieGoal || 2500;
  const caloriesRemaining = Math.max(0, calorieGoal - totalCaloriesBurned);
  const caloriePercent = Math.min(100, Math.round((totalCaloriesBurned / calorieGoal) * 100));

  const handleSaveGoal = (e) => {
    e.preventDefault();
    const val = parseInt(calorieInput, 10);
    if (!isNaN(val) && val > 0) {
      onUpdateGoals({ ...goals, calorieGoal: val });
      setIsEditingGoal(false);
    }
  };

  // Group exercises by category for a quick breakdown
  const categorySummary = todayExercises.reduce((acc, ex) => {
    acc[ex.category] = (acc[ex.category] || 0) + Number(ex.caloriesBurned);
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome & Quick Status Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900 border border-cyan-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 -mb-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-medium mb-3">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Daily Activity Overview
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">{profile.name || 'Athlete'}</span>! 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Here is your performance snapshot for today, <span className="text-slate-200 font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 px-5 py-3 rounded-2xl backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
              🔥
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Goal Status</div>
              <div className="text-sm font-bold text-slate-200">
                {totalCaloriesBurned >= calorieGoal ? (
                  <span className="text-emerald-400 flex items-center gap-1">Goal Achieved! 🎉</span>
                ) : (
                  <span>{caloriesRemaining} kcal remaining</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Calories Burned Card */}
        <div className="bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-6 transition-all duration-300 shadow-xl group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <button 
              onClick={() => setIsEditingGoal(true)}
              className="text-xs text-slate-400 hover:text-cyan-400 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-lg transition-colors border border-slate-700/50"
              title="Edit Calorie Goal"
            >
              Goal: {calorieGoal}
            </button>
          </div>
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Calories Burned</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-white tracking-tight">{totalCaloriesBurned}</span>
            <span className="text-xs text-slate-400">/ {calorieGoal} kcal</span>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Progress</span>
              <span className="text-cyan-400 font-medium">{caloriePercent}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${caloriePercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Active Time Card */}
        <div className="bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-6 transition-all duration-300 shadow-xl group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
              Active Today
            </span>
          </div>
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Duration</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-white tracking-tight">{totalDuration}</span>
            <span className="text-xs text-slate-400">minutes</span>
          </div>
          <div className="mt-4 text-xs text-slate-400 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            >
            <span>Keep your heart rate elevated</span>
          </div>
        </div>

        {/* Workouts Completed Card */}
        <div className="bg-slate-900/80 border border-slate-800/80 hover:border-blue-500/40 rounded-2xl p-6 transition-all duration-300 shadow-xl group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full font-medium">
              Sessions
            </span>
          </div>
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Workouts Logged</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-white tracking-tight">{workoutCount}</span>
            <span className="text-xs text-slate-400">sessions today</span>
          </div>
          <div className="mt-4 text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-blue-400 font-semibold">{exercises.length}</span> total logs all-time
          </div>
        </div>

        {/* Profile Weight Card */}
        <div className="bg-slate-900/80 border border-slate-800/80 hover:border-purple-500/40 rounded-2xl p-6 transition-all duration-300 shadow-xl group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <span className="text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full font-medium">
              Body Stats
            </span>
          </div>
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Current Weight</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-white tracking-tight">{profile.weight || 70}</span>
            <span className="text-xs text-slate-400">{profile.weightUnit || 'kg'}</span>
          </div>
          <div className="mt-4 text-xs text-slate-400 flex items-center gap-1.5">
            Target: <span className="text-purple-400 font-semibold">{profile.targetWeight || 65} {profile.weightUnit || 'kg'}</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Today's Activity Breakdown & Quick Motivation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Logged Exercises Preview */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Today's Workout Activity
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Exercises logged for {todayStr}</p>
              </div>
              <span className="text-xs px-3 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700 font-medium">
                {todayExercises.length} items
              </span>
            </div>

            {todayExercises.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-300">No workouts logged yet today</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Head over to the <span className="text-cyan-400 font-medium">Log Workout</span> tab to record your first session and start tracking calories!
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {todayExercises.map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-semibold text-sm flex-shrink-0">
                        {ex.category === 'Cardio' ? '🏃‍♂️' : ex.category === 'Strength' ? '🏋️‍♂️' : ex.category === 'HIIT' ? '⚡' : ex.category === 'Yoga' ? '🧘‍♀️' : '🚴‍♂️'}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{ex.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span className="text-cyan-400 font-medium">{ex.category}</span>
                          <span>•</span>
                          <span>{ex.duration} mins</span>
                          {ex.sets && <span>• {ex.sets} sets</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">+{ex.caloriesBurned} kcal</div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">{ex.intensity} intensity</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Breakdown Badges */}
          {Object.keys(categorySummary).length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium mr-1">Burn by Category:</span>
              {Object.entries(categorySummary).map(([cat, cals]) => (
                <span key={cat} className="text-xs bg-slate-800/80 border border-slate-700/60 text-slate-300 px-3 py-1 rounded-xl font-medium">
                  {cat}: <strong className="text-cyan-400">{cals} kcal</strong>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Daily Tips / AI Fitness Coach Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium w-fit mb-4">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Daily Health Tip
            </div>
            <h3 className="text-base font-bold text-white mb-2">Hydration & Recovery</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Drinking adequate water during strenuous workouts prevents cramping and increases stamina by up to <span className="text-emerald-400 font-semibold">15%</span>. Make sure to replenish electrolytes after high-intensity intervals!
            </p>

            <div className="mt-6 p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Actions</div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setIsEditingGoal(true)}
                  className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-xl border border-slate-700/60 transition-colors text-center"
                >
                  Edit Goal
                </button>
                <button 
                  onClick={() => alert('Tip: Consistency beats intensity. Keep logging daily!')}
                  className="w-full py-2 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-xl border border-cyan-500/30 transition-colors text-center"
                >
                  Get Advice
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
            PulseFit v1.0.0 • Stay strong & active
          </div>
        </div>
      </div>

      {/* Edit Calorie Goal Modal */}
      {isEditingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <h3 className="text-xl font-bold text-white mb-2">Update Daily Calorie Goal</h3>
            <p className="text-xs text-slate-400 mb-6">
              Set your target active calories to burn each day. Adjust according to your fitness objective.
            </p>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Target Calories (kcal)
                </label>
                <input 
                  type="number"
                  min="500"
                  max="10000"
                  step="50"
                  value={calorieInput}
                  onChange={(e) => setCalorieInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingGoal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}