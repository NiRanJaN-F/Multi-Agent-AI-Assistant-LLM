import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import KPICards from './components/KPICards';
import DataTables from './components/DataTables';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [analyticsData, setAnalyticsData] = useState([]);
  const [selectedTab, setSelectedTab] = useState('Dashboard');

  useEffect(() => {
    // Fetch analytics data from API
    fetch('https://example.com/analytics')
      .then(res => res.json())
      .then(data => {
        setAnalyticsData(data);
      });
  }, []);

  const handleTabChange = (e) => {
    const { value } = e.target;
    setSelectedTab(value);
  };

  return (
    <Router>
      <div className="App">
        <Header analyticsData={analyticsData} handleTabChange={handleTabChange} />
        <main className="main-content">
          <Route exact path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/kpis" component={KPICards} />
          <Route path="/tables" component={DataTables} />
        </main>
        <Sidebar analyticsData={analyticsData} selectedTab={selectedTab} />
      </div>
    </Router>
  );
}

export default App;