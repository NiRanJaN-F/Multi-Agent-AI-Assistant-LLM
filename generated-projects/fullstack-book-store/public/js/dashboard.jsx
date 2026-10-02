const { useState, useEffect } = React;

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        return res.json();
      })
      .then(data => {
        setAnalyticsData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (analyticsData && !loading) {
      renderCharts(analyticsData);
    }
  }, [analyticsData, loading]);

  const renderCharts = (data) => {
    // Revenue Line Chart
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
      if (window.revenueChartInstance) {
        window.revenueChartInstance.destroy();
      }
      window.revenueChartInstance = new Chart(revenueCtx, {
        type: 'line',
        data: {
          labels: data.revenueTrend ? data.revenueTrend.map(item => item.month) : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Monthly Revenue ($)',
            data: data.revenueTrend ? data.revenueTrend.map(item => item.revenue) : [12000, 19000, 30000, 25000, 32000, 45000],
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    // Traffic Sources Doughnut Chart
    const trafficCtx = document.getElementById('trafficChart');
    if (trafficCtx) {
      if (window.trafficChartInstance) {
        window.trafficChartInstance.destroy();
      }
      window.trafficChartInstance = new Chart(trafficCtx, {
        type: 'doughnut',
        data: {
          labels: data.trafficSources ? data.trafficSources.map(item => item.source) : ['Direct', 'Search', 'Referral', 'Social'],
          datasets: [{
            data: data.trafficSources ? data.trafficSources.map(item => item.visitors) : [4000, 3000, 2000, 1000],
            backgroundColor: ['#4f46e5', '#38bdf8', '#f59e0b', '#ec4899']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-600">
        <div className="text-xl font-semibold animate-pulse">Loading analytics dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-red-600">
        <div className="text-xl font-semibold">Error: {error}</div>
      </div>
    );
  }

  const kpis = analyticsData?.kpis || [
    { title: 'Total Revenue', value: '$45,231', change: '+20.1% from last month', isPositive: true },
    { title: 'Active Users', value: '+2,350', change: '+180.1% from last month', isPositive: true },
    { title: 'Conversion Rate', value: '3.42%', change: '-4.5% from last month', isPositive: false },
    { title: 'Bounce Rate', value: '42.3%', change: '-1.2% from last month', isPositive: true }
  ];

  const tableData = analyticsData?.recentActivity || [
    { id: 1, user: 'John Doe', action: 'Purchased Pro Plan', date: '2023-10-25', status: 'Completed' },
    { id: 2, user: 'Jane Smith', action: 'Updated Profile', date: '2023-10-24', status: 'Pending' },
    { id: 3, user: 'Bob Johnson', action: 'Cancelled Subscription', date: '2023-10-24', status: 'Failed' },
    { id: 4, user: 'Alice Brown', action: 'Signed Up', date: '2023-10-23', status: 'Completed' }
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Responsive Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950">
          <span className="text-xl font-bold tracking-wider text-indigo-400">Analtica</span>
          <button 
            className="md:hidden text-gray-400 hover:text-white focus:outline-none"
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <a href="#" className="flex items-center px-4 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 text-white">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            Dashboard
          </a>
          <a href="#" className="flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:bg-slate-800 hover:text-white">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Analytics
          </a>
          <a href="#" className="flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:bg-slate-800 hover:text-white">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            Customers
          </a>
          <a href="#" className="flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:bg-slate-800 hover:text-white">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Settings
          </a>
        </nav>
        <div className="p-4 bg-slate-950 text-xs text-gray-500 text-center">
          v1.0.0 • Analytics Pro
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 z-10">
          <button 
            className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-gray-800">Overview Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </span>
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full py-2 pl-10 pr-4 text-sm bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm">
              AD
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {kpis.map((kpi, idx) => (
                <div key={idx} className="bg-white overflow-hidden shadow rounded-lg p-5 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500 truncate">{kpi.title}</p>
                    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded ${kpi.isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {kpi.change.split(' ')[0]}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline">
                    <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{kpi.change}</p>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* Revenue Line Chart */}
              <div className="bg-white overflow-hidden shadow rounded-lg p-5 lg:col-span-2 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Revenue Overview</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded">Monthly</span>
                </div>
                <div className="relative h-72">
                  <canvas id="revenueChart"></canvas>
                </div>
              </div>

              {/* Traffic Sources Doughnut Chart */}
              <div className="bg-white overflow-hidden shadow rounded-lg p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Traffic Sources</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded">Total</span>
                </div>
                <div className="relative h-72 flex items-center justify-center">
                  <canvas id="trafficChart"></canvas>
                </div>
              </div>
            </div>

            {/* Data Table Section */}
            <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-900">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tableData.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.user}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.action}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            row.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            row.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

ReactDOM.render(<Dashboard />, document.getElementById('root'));