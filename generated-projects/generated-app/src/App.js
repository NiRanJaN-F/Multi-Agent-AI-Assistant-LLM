// src/App.js
import React, { useEffect, useState, useCallback } from "react";
import Layout from "./components/Layout";
import Sidebar from "./components/Sidebar";
import KPICards from "./components/KPICards";
import Charts from "./components/Charts";
import DataTables from "./components/DataTables";
import {
  fetchKPIs,
  fetchChartData,
  fetchTableData,
} from "./api/analytics";

const DEFAULT_DATE_RANGE = {
  start: new Date(new Date().setDate(new Date().getDate() - 30))
    .toISOString()
    .slice(0, 10),
  end: new Date().toISOString().slice(0, 10),
};

function App() {
  const [kpis, setKPIs] = useState([]);
  const [charts, setCharts] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(() => {
    const stored = localStorage.getItem("dashboardDateRange");
    return stored ? JSON.parse(stored) : DEFAULT_DATE_RANGE;
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpiRes, chartRes, tableRes] = await Promise.all([
        fetchKPIs(dateRange),
        fetchChartData(dateRange),
        fetchTableData(dateRange),
      ]);
      setKPIs(kpiRes);
      setCharts(chartRes);
      setTables(tableRes);
    } catch (err) {
      console.error(err);
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    localStorage.setItem("dashboardDateRange", JSON.stringify(dateRange));
  }, [dateRange]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRefresh = () => {
    loadData();
  };

  return (
    <Layout
      sidebar={<Sidebar activeItem="dashboard" />}
      header={
        <div className="dashboard-header" style={headerStyle}>
          <h1 style={{ margin: 0 }}>Analytics Dashboard</h1>
          <div style={filterContainerStyle}>
            <label>
              From:&nbsp;
              <input
                type="date"
                name="start"
                value={dateRange.start}
                onChange={handleDateChange}
                style={inputStyle}
              />
            </label>
            <label>
              To:&nbsp;
              <input
                type="date"
                name="end"
                value={dateRange.end}
                onChange={handleDateChange}
                style={inputStyle}
              />
            </label>
            <button onClick={handleRefresh} style={buttonStyle}>
              Refresh
            </button>
          </div>
        </div>
      }
    >
      <main className="dashboard-main" style={mainStyle}>
        {loading && <p>Loading data...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && !error && (
          <>
            <KPICards data={kpis} />
            <Charts data={charts} />
            <DataTables data={tables} />
          </>
        )}
      </main>
    </Layout>
  );
}

/* Inline styles – you can move these to a CSS/SCSS file if preferred */
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  padding: "1rem",
  backgroundColor: "#f8f9fa",
  borderBottom: "1px solid #dee2e6",
};

const filterContainerStyle = {
  display: "flex",
  gap: "0.5rem",
  alignItems: "center",
};

const inputStyle = {
  padding: "0.25rem 0.5rem",
  border: "1px solid #ced4da",
  borderRadius: "4px",
};

const buttonStyle = {
  padding: "0.4rem 0.8rem",
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const mainStyle = {
  padding: "1rem",
  overflowY: "auto",
};

export default App;