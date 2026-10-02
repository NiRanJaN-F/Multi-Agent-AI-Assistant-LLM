import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KpiCard from './components/KpiCard';
import AnalyticsCharts from './components/AnalyticsCharts';
import DataTable from './components/DataTable';
import { 
  kpiData, 
  revenueData, 
  trafficData, 
  categoryData, 
  recentTransactions, 
  activityLog 
} from './mockData';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Initialize Lucide icons on mount & tab/state changes
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab, sidebarOpen, notificationsOpen, profileOpen, isExporting]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      showToast('Successfully exported report CSV & PDF packages.');
    }, 1500);
  };

  const handleRefresh = () => {
    showToast('Dashboard data synchronized with live servers.');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 animate-bounce">
          <i data-lucide="check-circle-2" className="w-5 h-5 text-emerald-400"></i>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Component */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          setSidebarOpen={setSidebarOpen} 
          timeRange={timeRange} 
          setTimeRange={setTimeRange}
          onExport={handleExport}
          onRefresh={handleRefresh}
          isExporting={isExporting}
          notificationsOpen={notificationsOpen}
          setNotificationsOpen={setNotificationsOpen}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
        />

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Welcome banner & Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-400 via-slate-500 to-transparent pointer-events-none"></div>
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Enterprise Mode Active
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back, Sarah! 👋</h1>
                <p className="text-indigo-200 text-sm mt-1 max-w-xl">
                  Here's a snapshot of your global analytics pipeline. Monthly user acquisition is up by <span className="text-emerald-400 font-semibold">+14.8%</span> compared to last cycle.
                </p>
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <button 
                  onClick={handleExport}
                  disabled={isExporting}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition border border-white/10 backdrop-blur-md"
                >
                  <i data-lucide="download" className={`w-4 h-4 ${isExporting ? 'animate-spin' : ''}`}></i>
                  {isExporting ? 'Exporting...' : 'Export Reports'}
                </button>
                <button 
                  onClick={() => showToast('New custom report generator launched.')}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition"
                >
                  <i data-lucide="plus" className="w-4 h-4"></i>
                  Create Widget
                </button>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {kpiData.map((kpi, idx) => (
                <KpiCard key={idx} data={kpi} />
              ))}
            </div>

            {/* Analytics Charts Component */}
            <AnalyticsCharts 
              revenueData={revenueData} 
              trafficData={trafficData} 
              categoryData={categoryData} 
            />

            {/* Data Tables and Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DataTable transactions={recentTransactions} />
              </div>

              {/* Activity Log / Live Feed */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold text-slate-900">System Activity</h3>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">Real-time</span>
                  </div>
                  <div className="space-y-4">
                    {activityLog.map((act) => (
                      <div key={act.id} className="flex items-start gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                        <div className={`p-2 rounded-xl mt-0.5 ${
                          act.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                          act.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                          act.type === 'alert' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          <i data-lucide={
                            act.type === 'success' ? 'check-circle' :
                            act.type === 'warning' ? 'alert-triangle' :
                            act.type === 'alert' ? 'shield-alert' : 'info'
                          } className="w-4 h-4"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{act.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{act.description}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{act.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => showToast('Full server logs downloaded successfully.')}
                    className="w-full text-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition flex items-center justify-center gap-1.5 py-2 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl"
                  >
                    <span>View Complete System Logs</span>
                    <i data-lucide="arrow-right" className="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="pt-6 pb-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">N</div>
                <span className="font-semibold text-slate-700">Nexus Analytics Enterprise v4.8</span>
                <span>© {new Date().getFullYear()} All rights reserved.</span>
              </div>
              <div className="flex items-center gap-6">
                <a href="#privacy" onClick={(e) => {e.preventDefault(); showToast('Privacy Policy viewed.');}} className="hover:text-slate-900 transition">Privacy Policy</a>
                <a href="#terms" onClick={(e) => {e.preventDefault(); showToast('Terms of Service viewed.');}} className="hover:text-slate-900 transition">Terms of Service</a>
                <a href="#security" onClick={(e) => {e.preventDefault(); showToast('SOC2 Type II Compliance verified.');}} className="hover:text-slate-900 transition">Security & Trust</a>
                <a href="#api" onClick={(e) => {e.preventDefault(); showToast('API Documentation portal opened.');}} className="hover:text-slate-900 transition">API Docs</a>
              </div>
            </footer>

          </div>
        </main>
      </div>
    </div>
  );
}