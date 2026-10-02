import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function AnalyticsCharts({ revenueData, trafficData, categoryData }) {
  const [activeTab, setActiveTab] = useState('revenue');
  const [timeframe, setTimeframe] = useState('monthly');

  const COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700/85 text-xs">
          <p className="font-semibold text-slate-300 mb-1.5 border-b border-slate-800 pb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.stroke || entry.fill }}></span>
                <span className="capitalize text-slate-300">{entry.name}:</span>
              </span>
              <span className="font-mono font-medium text-white">
                {entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('sales')
                  ? `$${entry.value.toLocaleString()}`
                  : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Main Revenue / Traffic Chart (Span 2 cols on large screens) */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">
              {activeTab === 'revenue' ? 'Revenue & Profit Performance' : 'User Traffic Overview'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === 'revenue' 
                ? 'Comparative analysis of incoming gross revenue and net profit over time.' 
                : 'Visitor acquisition metrics including unique visitors and pageviews.'}
            </p>
          </div>
          
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/60 text-xs font-medium">
              <button
                onClick={() => setActiveTab('revenue')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'revenue'
                    ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Financials
              </button>
              <button
                onClick={() => setActiveTab('traffic')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'traffic'
                    ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Traffic
              </button>
            </div>

            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium cursor-pointer"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'revenue' ? (
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#e2e8f0' }} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} 
                  formatter={(value) => <span className="text-slate-600 font-medium capitalize">{value}</span>}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue" 
                  stroke="#6366f1" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  name="Profit" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
              </AreaChart>
            ) : (
              <BarChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#e2e8f0' }} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} 
                  formatter={(value) => <span className="text-slate-600 font-medium capitalize">{value}</span>}
                />
                <Bar dataKey="visitors" name="Visitors" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={28} />
                <Bar dataKey="pageviews" name="Pageviews" fill="#06b6d4" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown Donut Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Sales by Category</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribution across product lines</p>
          </div>
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[11px] font-semibold rounded-full border border-indigo-100">
            YTD
          </span>
        </div>

        <div className="h-[230px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-slate-100">
          {categoryData.map((cat, idx) => (
            <div key={cat.name} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
              <span className="text-slate-600 truncate font-medium">{cat.name}</span>
              <span className="ml-auto font-mono text-slate-900 font-semibold">{cat.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}