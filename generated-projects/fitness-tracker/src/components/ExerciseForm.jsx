import React, { useState, useEffect } from 'react';

const EXERCISE_CATEGORIES = [
  { id: 'Cardio', label: 'Cardio', icon: '🏃‍♂️', defaultCalPerMin: 10, defaultDuration: 30 },
  { id: 'Strength', label: 'Strength', icon: '🏋️‍♂️', defaultCalPerMin: 7, defaultDuration: 45 },
  { id: 'Flexibility', label: 'Flexibility', icon: '🧘‍♀️', defaultCalPerMin: 4, defaultDuration: 20 },
  { id: 'HIIT', label: 'HIIT', icon: '⚡', defaultCalPerMin: 12, defaultDuration: 25 },
  { id: 'Sports', label: 'Sports', icon: '⚽', defaultCalPerMin: 9, defaultDuration: 60 }
];

const PRESET_WORKOUTS = {
  Cardio: [
    { name: 'Running (Outdoor)', calPerMin: 11.5, defaultDuration: 30 },
    { name: 'Cycling (Moderate)', calPerMin: 8.5, defaultDuration: 45 },
    { name: 'Jump Rope', calPerMin: 12.0, defaultDuration: 15 },
    { name: 'Swimming Laps', calPerMin: 10.0, defaultDuration: 30 },
    { name: 'Rowing Machine', calPerMin: 9.5, defaultDuration: 30 }
  ],
  Strength: [
    { name: 'Weightlifting (Heavy)', calPerMin: 6.0, defaultDuration: 50 },
    { name: 'CrossFit WOD', calPerMin: 11.0, defaultDuration: 30 },
    { name: 'Bodyweight Circuit', calPerMin: 8.0, defaultDuration: 30 },
    { name: 'Kettlebell Workout', calPerMin: 10.0, defaultDuration: 25 }
  ],
  Flexibility: [
    { name: 'Vinyasa Yoga', calPerMin: 4.5, defaultDuration: 45 },
    { name: 'Mat Pilates', calPerMin: 5.0, defaultDuration: 40 },
    { name: 'Deep Stretching', calPerMin: 3.0, defaultDuration: 20 }
  ],
  HIIT: [
    { name: 'Tabata Intervals', calPerMin: 13.0, defaultDuration: 20 },
    { name: 'Sprint Intervals', calPerMin: 14.0, defaultDuration: 20 },
    { name: 'Full Body HIIT', calPerMin: 11.5, defaultDuration: 30 }
  ],
  Sports: [
    { name: 'Basketball Game', calPerMin: 10.0, defaultDuration: 60 },
    { name: 'Tennis Singles', calPerMin: 9.0, defaultDuration: 60 },
    { name: 'Soccer Match', calPerMin: 10.5, defaultDuration: 60 }
  ]
};

export default function ExerciseForm({ onAddExercise }) {
  const [category, setCategory] = useState('Cardio');
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [calories, setCalories] = useState(300);
  const [intensity, setIntensity] = useState('Medium');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [autoCalculate, setAutoCalculate] = useState(true);

  // Update calories and name default when category changes or preset selected
  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const catObj = EXERCISE_CATEGORIES.find(c => c.id === newCat);
    const presets = PRESET_WORKOUTS[newCat];
    if (presets && presets.length > 0) {
      setName(presets[0].name);
      const defDur = presets[0].defaultDuration;
      setDuration(defDur);
      if (autoCalculate) {
        setCalories(Math.round(defDur * presets[0].calPerMin));
      }
    }
  };

  const handlePresetSelect = (preset) => {
    setName(preset.name);
    setDuration(preset.defaultDuration);
    if (autoCalculate) {
      setCalories(Math.round(preset.defaultDuration * preset.calPerMin));
    }
  };

  // Recalculate calories when duration changes if autoCalculate is on
  const handleDurationChange = (newDur) => {
    const durNum = Math.max(1, parseInt(newDur) || 0);
    setDuration(durNum);
    if (autoCalculate) {
      const presets = PRESET_WORKOUTS[category] || [];
      const currentPreset = presets.find(p => p.name === name);
      const calPerMin = currentPreset ? currentPreset.calPerMin : (EXERCISE_CATEGORIES.find(c => c.id === category)?.defaultCalPerMin || 8);
      setCalories(Math.round(durNum * calPerMin));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newExercise = {
      id: Date.now().toString(),
      name: name.trim(),
      category,
      duration: Number(duration),
      calories: Number(calories),
      intensity,
      date,
      notes: notes.trim()
    };

    onAddExercise(newExercise);

    // Reset form / set fresh date
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  const currentPresets = PRESET_WORKOUTS[category] || [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-3">
            <span className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Log New Workout
          </h2>
          <p className="text-slate-400 text-sm mt-1">Record your training session, calculate calories burned, and track progress.</p>
        </div>

        {/* Auto-calculate toggle */}
        <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800/80 self-start sm:self-auto">
          <span className="text-xs font-medium text-slate-400">Auto Calorie Est.</span>
          <button
            type="button"
            onClick={() => setAutoCalculate(!autoCalculate)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
              autoCalculate ? 'bg-cyan-500' : 'bg-slate-800'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                autoCalculate ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Category Selection Tabs */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {EXERCISE_CATEGORIES.map((cat) => {
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                  isSelected
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Presets for Selected Category */}
      {currentPresets.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Presets ({category})</label>
            <span className="text-xs text-slate-500">Click to autofill</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  name === preset.name
                    ? 'bg-cyan-500 text-slate-950 font-semibold border-cyan-400'
                    : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                {preset.name} ({preset.defaultDuration}m)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Exercise Name */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Exercise Name <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Jog, Bench Press..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
            />
          </div>

          {/* Intensity */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Intensity
            </label>
            <select
              value={intensity}
              onChange={(e) => setIntensity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
            >
              <option value="Low">Low 😌</option>
              <option value="Medium">Medium 😅</option>
              <option value="High">High 🔥</option>
              <option value="Extreme">Extreme ⚡</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Duration (minutes)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="1440"
                required
                value={duration}
                onChange={(e) => handleDurationChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
              />
              <span className="absolute right-4 top-3 text-xs text-slate-500 font-medium">min</span>
            </div>
          </div>

          {/* Calories Burned */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Calories Burned</span>
              {autoCalculate && <span className="text-[10px] text-cyan-400 font-normal">Auto-estimated</span>}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="10000"
                required
                value={calories}
                onChange={(e) => {
                  setCalories(e.target.value);
                  setAutoCalculate(false);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
              />
              <span className="absolute right-4 top-3 text-xs text-slate-500 font-medium">kcal</span>
            </div>
          </div>

          {/* Notes / Sets & Reps */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Notes / Sets & Reps (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 3 sets of 10 reps, felt great!"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
            />
          </div>

        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-200 flex items-center justify-center gap-2 transform active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Save Workout to Log</span>
          </button>
        </div>
      </form>
    </div>
  );
}