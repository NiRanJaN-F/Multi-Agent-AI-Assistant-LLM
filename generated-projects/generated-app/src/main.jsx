import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import KPICards from './components/KPICards';
import DataTables from './components/DataTables';
import Sidebar from './components/Sidebar';
import './styles/main.css';

function App() {
  const [selectedTab, setSelectedTab] = useState('Dashboard');
  const [analyticsData, setAnalyticsData] = useState({});

  useEffect(() => {
    // Load analytics data from localStorage on mount
    const storedData = localStorage.getItem('analyticsData');
    if (storedData) {
      setAnalyticsData(JSON.parse(storedData));
    }
  }, []);

  const handleTabChange = (e) => {
    const { value } = e.target;
    setSelectedTab(value);
  };

  const handleDataLoad = () => {
    // Load data from API and store in localStorage
    // Implement data fetching logic here
  };

  return (
    <Router>
      <div className="app-container">
        <Header selectedTab={selectedTab} handleTabChange={handleTabChange} />
        <main className="main-content">
          <Route exact path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/kpi" component={KPICards} />
          <Route path="/data" component={DataTables} />
        </Route>
      </main>
      <Sidebar selectedTab={selectedTab} handleTabChange={handleTabChange} />
    </Router>
  );
}

export default App;