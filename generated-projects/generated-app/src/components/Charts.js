import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { fetchAnalyticsData } from '../api/analytics';

const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
};

const METRICS = [
  { value: 'sales', label: 'Sales' },
  { value: 'visits', label: 'Visits' },
  { value: 'revenue', label: 'Revenue' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6699'];

const Charts = () => {
  const [data, setData] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState(
    localStorage.getItem('selectedMetric') || 'sales'
  );
  const [loading, setLoading] = useState(true);

  const loadData = async (metric) => {
    setLoading(true);
    try {
      const raw = await fetchAnalyticsData(metric);
      // Assume raw is an array of objects: { date, sales, visits, revenue, category }
      const transformed = raw.map((item) => ({
        date: item.date,
        sales: item.sales,
        visits: item.visits,
        revenue: item.revenue,
        category: item.category,
      }));
      setData(transformed);
    } catch (e) {
      console.error('Failed to load analytics data', e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedMetric);
  }, [selectedMetric]);

  const handleMetricChange = (e) => {
    const metric = e.target.value;
    setSelectedMetric(metric);
    localStorage.setItem('selectedMetric', metric);
  };

  const lineData = data.map((d) => ({
    date: d.date,
    value: d[selectedMetric],
  }));

  const barData = data.reduce((acc, cur) => {
    const key = cur.category;
    const existing = acc.find((item) => item.category === key);
    if (existing) {
      existing.value += cur[selectedMetric];
    } else {
      acc.push({ category: key, value: cur[selectedMetric] });
    }
    return acc;
  }, []);

  const pieData = barData.map((item) => ({
    name: item.category,
    value: item.value,
  }));

  return (
    <div id="charts" className="charts-container">
      <div className="charts-header">
        <label htmlFor="metric-select">Select Metric:</label>
        <select
          id="metric-select"
          value={selectedMetric}
          onChange={handleMetricChange}
        >
          {METRICS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="charts-loading">Loading charts...</div>
      ) : (
        <div className="charts-grid">
          <div className="chart-card" id="line-chart-card">
            <h3>{METRICS.find((m) => m.value === selectedMetric).label} Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card" id="bar-chart-card">
            <h3>{METRICS.find((m) => m.value === selectedMetric).label} by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card" id="pie-chart-card">
            <h3>{METRICS.find((m) => m.value === selectedMetric).label} Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Charts;