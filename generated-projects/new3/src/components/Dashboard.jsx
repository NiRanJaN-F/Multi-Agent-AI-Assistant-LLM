// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import KPICard from './KPICard';
import Chart from './Chart';
import DataTable from './DataTable';
import {
  fetchKPIData,
  fetchChartData,
  fetchTableData,
} from '../api';

const DEFAULT_FILTERS = {
  dateRange: 'last7days',
  metric: 'sales',
};

const Dashboard = () => {
  const [filters, setFilters] = useState(() => {
    const stored = localStorage.getItem('dashboardFilters');
    return stored ? JSON.parse(stored) : DEFAULT_FILTERS;
  });

  const [kpiData, setKpiData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpi, chart, table] = await Promise.all([
        fetchKPIData(filters),
        fetchChartData(filters),
        fetchTableData(filters),
      ]);
      setKpiData(kpi);
      setChartData(chart);
      setTableData(table);
      if (table.length > 0) {
        setTableColumns(Object.keys(table[0]).map((key) => ({
          title: key.charAt(0).toUpperCase() + key.slice(1),
          dataIndex: key,
          key,
        })));
      } else {
        setTableColumns([]);
      }
    } catch (err) {
      setError(err.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  useEffect(() => {
    localStorage.setItem('dashboardFilters', JSON.stringify(filters));
  }, [filters]);

  const handleDateRangeChange = (e) => {
    setFilters((prev) => ({ ...prev, dateRange: e.target.value }));
  };

  const handleMetricChange = (e) => {
    setFilters((prev) => ({ ...prev, metric: e.target.value }));
  };

  return (
    <div className="dashboard-container" id="dashboard">
      <header className="dashboard-header">
        <h1>Analytics Dashboard</h1>
      </header>

      <section className="dashboard-filters" id="dashboard-filters">
        <label htmlFor="date-range-select">
          Date Range:
          <select
            id="date-range-select"
            value={filters.dateRange}
            onChange={handleDateRangeChange}
          >
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
          </select>
        </label>

        <label htmlFor="metric-select">
          Metric:
          <select
            id="metric-select"
            value={filters.metric}
            onChange={handleMetricChange}
          >
            <option value="sales">Sales</option>
            <option value="visits">Visits</option>
            <option value="conversion">Conversion Rate</option>
          </select>
        </label>
      </section>

      {loading && (
        <div className="dashboard-loading" id="dashboard-loading">
          Loading data...
        </div>
      )}

      {error && (
        <div className="dashboard-error" id="dashboard-error">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="dashboard-kpis" id="dashboard-kpis">
            {kpiData.map((kpi) => (
              <KPICard
                key={kpi.id}
                title={kpi.title}
                value={kpi.value}
                icon={kpi.icon}
              />
            ))}
          </section>

          <section className="dashboard-charts" id="dashboard-charts">
            {chartData.map((chart) => (
              <Chart
                key={chart.id}
                title={chart.title}
                data={chart.data}
                type={chart.type}
              />
            ))}
          </section>

          <section className="dashboard-table" id="dashboard-table">
            <DataTable data={tableData} columns={tableColumns} />
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;