import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import KPICards from './components/KPICards';
import DataTables from './components/DataTables';
import './styles/main.css';

function App() {
  const [analyticsData, setAnalyticsData] = useState([]);

  useEffect(() => {
    // Fetch analytics data from API
    fetch('https://example.com/analytics')
      .then(res => res.json())
      .then(data => setAnalyticsData(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <Router>
      <Header />
      <div className="app-container">
        <Route exact path="/" component={Dashboard} />
        <Route path="/kpi" component={KPICards} />
        <Route path="/data" component={DataTables} />
      </div>
    </Router>
  );
}

export default App;