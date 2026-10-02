import React, { useState } from 'react';

export default function Header({ profile, goals, onUpdateProfile, onUpdateGoals }) {
  const [showSettings, setShowSettings] = useState(false);
  const [calorieInput, setCalorieInput] = useState(goals.dailyCalories || 2500);
  const [nameInput, setNameInput] = useState(profile.name || 'Athlete');
  const [avatarInput, setAvatarInput] = useState(profile.avatar || '⚡');

  const avatars = ['⚡', '🔥', '💪', '🦁', '🚀', '⭐', '🎯', '🏆'];

  const handleSaveSettings = (e) => {
    e.preventDefault();
    onUpdateGoals({ ...goals, dailyCalories: parseInt(calorieInput) || 2000 });
    onUpdateProfile({ ...profile, name: nameInput, avatar: avatarInput });
    setShowSettings(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/30">
            <svg className="w-6 h-6 text-slate-950 font-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent flex items-center gap-1.5">
              PulseFit <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold tracking-wider">Pro</span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">Advanced Workout & Calorie Tracker</p>
          </div>
        </div>

        {/* Center Quick Stats / Motivation */}
        <div className="hidden md:flex items-center gap-6 px-4 py-2 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
              🔥
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Daily Goal</div>
              <div className="text-sm font-bold text-slate-200">{goals.dailyCalories} <span className="text-xs text-slate-400 font-normal">kcal</span></div>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800"></div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              ⚡
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</div>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Track
              </div>
            </div>
          </div>
        </div>

        {/* User Profile & Settings Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-3 p-1.5 sm:pr-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 transition-all group shadow-sm"
            title="Edit Profile & Goals"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
              {profile.avatar || '⚡'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">{profile.name || 'Athlete'}</div>
              <div className="text-xs text-slate-400">Settings & Goals</div>
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 hidden sm:block ml-1 transition-transform group-hover:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  ⚙️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Profile & Goals</h3>
                  <p className="text-xs text-slate-400">Customize your fitness tracking targets</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Athlete Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Choose Avatar
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {avatars.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatarInput(emoji)}
                      className={`h-12 rounded-xl text-2xl flex items-center justify-center border transition-all ${
                        avatarInput === emoji
                          ? 'bg-cyan-500/20 border-cyan-500 text-white scale-105 shadow-lg shadow-cyan-500/20'
                          : 'bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Daily Calorie Burn Goal (kcal)
                </label>
                <input
                  type="number"
                  min="500"
                  max="10000"
                  step="50"
                  value={calorieInput}
                  onChange={(e) => setCalorieInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1.5">Recommended daily active burn is between 2,000 and 3,500 kcal.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </header>
  );
}