import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";
import "./styles.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const kpiData = [
  { id: "kpi-1", title: "Total Users", value: "12,345", icon: "👥" },
  { id: "kpi-2", title: "Revenue", value: "$45,678", icon: "💰" },
  { id: "kpi-3", title: "Active Sessions", value: "1,234", icon: "⚡" },
  { id: "kpi-4", title: "Conversion Rate", value: "3.2%", icon: "📈" },
];

const barChartData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "Sales",
      data: [1200, 1900, 3000, 2500, 2200, 3400],
      backgroundColor: "rgba(75,192,192,0.6)",
    },
  ],
};

const lineChartData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "Visitors",
      data: [300, 500, 400, 600, 700, 800, 650],
      borderColor: "rgba(153,102,255,1)",
      fill: false,
      tension: 0.3,
    },
  ],
};

const pieChartData = {
  labels: ["Chrome", "Firefox", "Safari", "Edge", "Other"],
  datasets: [
    {
      data: [55, 20, 10, 8, 7],
      backgroundColor: [
        "#FF6384",
        "#36A2EB",
        "#FFCE56",
        "#4BC0C0",
        "#9966FF",
      ],
    },
  ],
};

const tableHeaders = ["ID", "Name", "Email", "Status"];
const tableRows = [
  ["1", "Alice Johnson", "alice@example.com", "Active"],
  ["2", "Bob Smith", "bob@example.com", "Inactive"],
  ["3", "Carol White", "carol@example.com", "Active"],
  ["4", "David Brown", "david@example.com", "Pending"],
];

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: "🏠" },
  { id: "reports", label: "Reports", icon: "📊" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("dashboard");

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed);
  }, [collapsed]);

  const toggleSidebar = () => setCollapsed((prev) => !prev);

  return (
    <div className="dashboard">
      <Header onToggleSidebar={toggleSidebar} />
      <div className="main">
        <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
          <nav>
            <ul>
              {sidebarItems.map((item) => (
                <li
                  key={item.id}
                  className={activeItem === item.id ? "active" : ""}
                  onClick={() => setActiveItem(item.id)}
                >
                  <span className="icon">{item.icon}</span>
                  {!collapsed && <span className="label">{item.label}</span>}
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <section className="content">
          {/* KPI Cards */}
          <div className="kpi-grid">
            {kpiData.map((kpi) => (
              <div key={kpi.id} className="kpi-card" id={kpi.id}>
                <div className="kpi-icon">{kpi.icon}</div>
                <div className="kpi-info">
                  <div className="kpi-title">{kpi.title}</div>
                  <div className="kpi-value">{kpi.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <div className="chart-card" id="bar-chart">
              <h3>Monthly Sales</h3>
              <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
            <div className="chart-card" id="line-chart">
              <h3>Weekly Visitors</h3>
              <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
            <div className="chart-card" id="pie-chart">
              <h3>Browser Share</h3>
              <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Data Table */}
          <div className="table-card" id="data-table">
            <h3>User List</h3>
            <table>
              <thead>
                <tr>
                  {tableHeaders.map((head) => (
                    <th key={head}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, idx) => (
                  <tr key={idx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}