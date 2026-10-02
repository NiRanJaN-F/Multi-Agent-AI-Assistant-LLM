import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Charts from './components/Charts';
import KPICards from './components/KPICards';
import DataTables from './components/DataTables';

function App() {
  const [analyticsData, setAnalyticsData] = useState([]);

  useEffect(() => {
    // Fetch analytics data from server
    fetch('/api/analytics')
      .then(response => response.json())
      .then(data => setAnalyticsData(data))
      .catch(error => console.error(error));
  }, []);

  return (
    <div className="App">
      <Header />
      <div className="container">
        <Dashboard analyticsData={analyticsData} />
        <Charts analyticsData={analyticsData} />
        <KPICards analyticsData={analyticsData} />
        <DataTables analyticsData={analyticsData} />
      </div>
    </div>
  );
}

export default App;