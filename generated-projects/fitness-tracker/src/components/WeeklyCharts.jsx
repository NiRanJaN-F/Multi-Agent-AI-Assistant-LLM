import React, { useState, useEffect, useRef } from 'react';

export default function WeeklyCharts({ exercises }) {
  const [chartType, setChartType] = useState('calories'); // 'calories', 'duration', 'category'
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Helper to get past 7 days (YYYY-MM-DD)
  const getLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const last7Days = getLast7Days();

  // Format date for display (e.g., "Mon", "Tue")
  const formatDayLabel = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
  };

  // Aggregate data for the past 7 days
  const dailyData = last7Days.map(date => {
    const dayExercises = exercises.filter(ex => ex.date === date);
    const totalCalories = dayExercises.reduce((acc, curr) => acc + (Number(curr.calories) || 0), 0);
    const totalDuration = dayExercises.reduce((acc, curr) => acc + (Number(curr.duration) || 0), 0);
    const count = dayExercises.length;
    return {
      date,
      label: formatDayLabel(date),
      calories: totalCalories,
      duration: totalDuration,
      count
    };
  });

  // Category breakdown
  const categoryMap = exercises.reduce((acc, curr) => {
    const cat = curr.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (Number(curr.calories) || 0);
    return acc;
  }, {});

  const categoryLabels = Object.keys(categoryMap);
  const categoryValues = Object.values(categoryMap);

  useEffect(() => {
    // Load Chart.js from CDN dynamically if not already loaded, or use global Chart
    const loadChartJs = async () => {
      if (!window.Chart) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');

      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      let chartConfig = {};

      if (chartType === 'calories') {
        chartConfig = {
          type: 'bar',
          data: {
            labels: dailyData.map(d => d.label),
            datasets: [{
              label: 'Calories Burned (kcal)',
              data: dailyData.map(d => d.calories),
              backgroundColor: 'rgba(6, 182, 212, 0.8)',
              borderColor: 'rgba(6, 182, 212, 1)',
              borderWidth: 1,
              borderRadius: 6,
              hoverBackgroundColor: 'rgba(6, 182, 212, 1)'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: '#94a3b8', font: { family: 'Inter' } } },
              tooltip: {
                backgroundColor: '#0f172a',
                titleColor: '#f8fafc',
                bodyColor: '#cbd5e1',
                borderColor: '#334155',
                borderWidth: 1,
                padding: 12,
                boxPadding: 6
              }
            },
            scales: {
              x: {
                grid: { color: 'rgba(51, 65, 85, 0.2)' },
                ticks: { color: '#94a3b8', font: { family: 'Inter' } }
              },
              y: {
                grid: { color: 'rgba(51, 65, 85, 0.2)' },
                ticks: { color: '#94a3b8', font: { family: 'Inter' } },
                beginAtZero: true
              }
            }
          }
        };
      } else if (chartType === 'duration') {
        chartConfig = {
          type: 'line',
          data: {
            labels: dailyData.map(d => d.label),
            datasets: [{
              label: 'Workout Duration (mins)',
              data: dailyData.map(d => d.duration),
              borderColor: '#a855f7',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.35,
              pointBackgroundColor: '#a855f7',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: '#94a3b8', font: { family: 'Inter' } } },
              tooltip: {
                backgroundColor: '#0f172a',
                titleColor: '#f8fafc',
                bodyColor: '#cbd5e1',
                borderColor: '#334155',
                borderWidth: 1,
                padding: 12
              }
            },
            scales: {
              x: {
                grid: { color: 'rgba(51, 65, 85, 0.2)' },
                ticks: { color: '#94a3b8', font: { family: 'Inter' } }
              },
              y: {
                grid: { color: 'rgba(51, 65, 85, 0.2)' },
                ticks: { color: '#94a3b8', font: { family: 'Inter' } },
                beginAtZero: true
              }
            }
          }
        };
      } else if (chartType === 'category') {
        chartConfig = {
          type: 'doughnut',
          data: {
            labels: categoryLabels.length > 0 ? categoryLabels : ['No Data'],
            datasets: [{
              data: categoryValues.length > 0 ? categoryValues : [1],
              backgroundColor: [
                '#06b6d4',
                '#a855f7',
                '#3b82f6',
                '#ec4899',
                '#10b981',
                '#f59e0b'
              ],
              borderColor: '#090d16',
              borderWidth: 2,
              hoverOffset: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: '#94a3b8', font: { family: 'Inter' }, padding: 16 }
              },
              tooltip: {
                backgroundColor: '#0f172a',
                titleColor: '#f8fafc',
                bodyColor: '#cbd5e1',
                borderColor: '#334155',
                borderWidth: 1,
                padding: 12
              }
            }
          }
        };
      }

      chartInstanceRef.current = new window.Chart(ctx, chartConfig);
    };

    loadChartJs().catch(err => console.error("Error loading Chart.js", err));

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [chartType, exercises]);

  // Summary statistics for past 7 days
  const totalCaloriesWeek = dailyData.reduce((acc, curr) => acc + curr.calories, 0);
  const totalDurationWeek = dailyData.reduce((acc, curr) => acc + curr.duration, 0);
  const totalWorkoutsWeek = dailyData.reduce((acc, curr) => acc + curr.count, 0);
  const avgCaloriesPerDay = Math.round(totalCaloriesWeek / 7);

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Weekly Analytics & Progress
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Analyze your performance trends over the past 7 days.
          </p>
        </div>

        {/* Chart View Switcher */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setChartType('calories')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
              chartType === 'calories'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Calories Burned
          </button>
          <button
            onClick={() => setChartType('duration')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
              chartType === 'duration'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Duration
          </button>
          <button
            onClick={() => setChartType('category')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
              chartType === 'category'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Categories
          </button>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-xl relative">
        <div className="h-80 sm:h-96 w-full relative">
          <canvas ref={canvasRef}></canvas>
        </div>
      </div>

      {/* 7-Day Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
            🔥
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">7-Day Total Burn</p>
            <h4 className="text-xl font-extrabold text-slate-100 mt-0.5">{totalCaloriesWeek.toLocaleString()} <span className="text-xs font-normal text-slate-400">kcal</span></h4>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
            ⏱️
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Active Time</p>
            <h4 className="text-xl font-extrabold text-slate-100 mt-0.5">{totalDurationWeek} <span className="text-xs font-normal text-slate-400">mins</span></h4>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
            🏋️
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Workouts Logged</p>
            <h4 className="text-xl font-extrabold text-slate-100 mt-0.5">{totalWorkoutsWeek} <span className="text-xs font-normal text-slate-400">sessions</span></h4>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            📊
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Daily Average</p>
            <h4 className="text-xl font-extrabold text-slate-100 mt-0.5">{avgCaloriesPerDay} <span className="text-xs font-normal text-slate-400">kcal/day</span></h4>
          </div>
        </div>
      </div>
    </div>
  );
}