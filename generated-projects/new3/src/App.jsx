import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import { fetchData } from './api.js';

const App = () => {
  // State for sidebar visibility, theme, data, and search filter
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const stored = localStorage.getItem('sidebarOpen');
    return stored !== null ? JSON.parse(stored) : true;
  });
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored || 'light';
  });
  const [data, setData] = useState({
    kpi: [],
    chart: [],
    table: [],
  });
  const [filter, setFilter] = useState('');

  // Persist sidebar state and theme to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch data on mount and when refresh is triggered
  const loadData = async () => {
    try {
      const result = await fetchData();
      setData({
        kpi: result.kpi || [],
        chart: result.chart || [],
        table: result.table || [],
      });
    } catch (e) {
      console.error('Failed to load data', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Event handlers
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  const handleSearchChange = (e) => setFilter(e.target.value);
  const refreshData = () => loadData();

  return (
    <div className={`app ${theme}`}>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      <div className="main">
        <header className="app-header">
          <h1>Analytics Dashboard</h1>
          <div className="header-controls">
            <input
              type="text"
              placeholder="Search..."
              value={filter}
              onChange={handleSearchChange}
              className="search-input"
            />
            <button onClick={refreshData} className="btn btn-refresh">
              Refresh
            </button>
            <button onClick={toggleTheme} className="btn btn-theme">
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
        </header>
        <Dashboard data={data} filter={filter} />
      </div>
    </div>
  );
};

export default App;