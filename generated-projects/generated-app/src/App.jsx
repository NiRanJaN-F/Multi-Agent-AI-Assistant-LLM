import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './App.css';

function App() {
  const [analyticsData, setAnalyticsData] = useState([]);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Fetch analytics data from API
    fetch('https://example.com/analytics')
      .then(response => response.json())
      .then(data => {
        setAnalyticsData(data);
      });
  }, []);

  const handleTabChange = (e) => {
    setSelectedTab(e.target.dataset.tab);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="App">
      <nav className="App-nav">
        <ul className="App-nav-list">
          <li className="App-nav-item" data-tab="dashboard">
            <Link to="/dashboard" onClick={handleTabChange}>Dashboard</Link>
          </li>
          <li className="App-nav-item" data-tab="reports">
            <Link to="/reports" onClick={handleTabChange}>Reports</Link>
          </li>
          <li className="App-nav-item" data-tab="settings">
            <Link to="/settings" onClick={handleTabChange}>Settings</Link>
          </li>
        </ul>
      </nav>

      <div className="App-content">
        <div className="App-content-sidebar">
          <div className="App-content-sidebar-toggle" onClick={handleSidebarToggle}>
            <span className={sidebarOpen ? 'App-content-sidebar-toggle-open' : ''}>
              <i className="fa fa-bars" aria-hidden="true"></i>
            </span>
          </div>
          <div className={sidebarOpen ? 'App-content-sidebar-wrapper' : ''}>
            <div className="App-content-sidebar-inner">
              <div className="App-content-sidebar-tab">
                <div className={selectedTab === 'dashboard' ? 'App-content-sidebar-tab-active' : ''}>
                  <h3>Dashboard</h3>
                  <div className="App-content-sidebar-tab-content">
                    <h2>Welcome to the Analytics Dashboard</h2>
                    <div className="App-content-sidebar-tab-content-inner">
                      <h3>Recent Analytics</h3>
                      <div className="App-content-sidebar-tab-content-inner-chart">
                        <Chart data={analyticsData} />
                      </div>
                      <div className="App-content-sidebar-tab-content-inner-kpis">
                        <KPICards data={analyticsData} />
                      </div>
                      <div className="App-content-sidebar-tab-content-inner-tables">
                        <DataTables data={analyticsData} />
                      </div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>
     <div className="App-content-main">
       <div className="App-content-main-chart">
         <Chart data={analyticsData} />
       </div>
       <div className="App-content-main-kpis">
         <KPICards data={analyticsData} />
       </div>
       <div className="App-content-main-tables">
         <DataTables data={analyticsData} />
       </div>
     </div>
     <div className="App-content-footer">
       <button className="App-content-footer-button" onClick={handleSidebarToggle}>
         {selectedTab}
       </button>
     </div>
    </div>
  </div>
</div>