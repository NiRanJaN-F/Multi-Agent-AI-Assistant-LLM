const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files from React build directory
app.use(express.static(path.join(__dirname, 'build')));

// ============================================================
// Data Generation Utilities
// ============================================================

function generateDateRange(days) {
  const dates = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// ============================================================
// Analytics Data Store (in-memory with simulated persistence)
// ============================================================

const analyticsStore = {
  kpis: {
    totalRevenue: 284500,
    totalUsers: 12847,
    conversionRate: 3.24,
    avgOrderValue: 142.50,
    activeSessions: 1243,
    bounceRate: 32.1,
    pageViews: 458920,
    newSignups: 847
  },
  revenueHistory: [],
  userGrowth: [],
  trafficSources: [],
  topProducts: [],
  recentOrders: [],
  userActivity: [],
  performanceMetrics: [],
  regionalData: [],
  categoryBreakdown: [],
  monthlyComparison: [],
  funnelData: [],
  deviceBreakdown: [],
  hourlyTraffic: [],
  customerSegments: [],
  supportTickets: [],
  lastUpdated: null
};

function initializeData() {
  const days = 90;
  const dates = generateDateRange(days);

  // Revenue history
  let cumulativeRevenue = 0;
  analyticsStore.revenueHistory = dates.map((date, i) => {
    const dailyRevenue = randomBetween(800, 5000);
    cumulativeRevenue += dailyRevenue;
    return {
      date,
      revenue: dailyRevenue,
      cumulative: cumulativeRevenue,
      orders: randomBetween(15, 120),
      avgOrderValue: randomFloat(80, 250)
    };
  });

  // User growth
  let cumulativeUsers = 0;
  analyticsStore.userGrowth = dates.map((date, i) => {
    const newUsers = randomBetween(20, 150);
    cumulativeUsers += newUsers;
    return {
      date,
      newUsers,
      cumulativeUsers,
      activeUsers: randomBetween(500, 3000),
      returningUsers: randomBetween(100, 800)
    };
  });

  // Traffic sources
  analyticsStore.trafficSources = [
    { source: 'Organic Search', visitors: 45230, percentage: 35.2, trend: 12.5, color: '#4F46E5' },
    { source: 'Direct', visitors: 28450, percentage: 22.1, trend: -3.2, color: '#059669' },
    { source: 'Social Media', visitors: 22100, percentage: 17.2, trend: 8.7, color: '#DC2626' },
    { source: 'Referral', visitors: 15680, percentage: 12.2, trend: 5.1, color: '#D97706' },
    { source: 'Email Campaign', visitors: 10240, percentage: 8.0, trend: -1.4, color: '#7C3AED' },
    { source: 'Paid Ads', visitors: 7320, percentage: 5.7, trend: 15.3, color: '#0891B2' }
  ];

  // Top products
  analyticsStore.topProducts = [
    { id: 'PRD-001', name: 'Premium Analytics Suite', category: 'Software', price: 299.99, unitsSold: 1247, revenue: 374087.53, rating: 4.8, stock: 150 },
    { id: 'PRD-002', name: 'Data Visualization Pro', category: 'Software', price: 199.99, unitsSold: 983, revenue: 196590.17, rating: 4.6, stock: 200 },
    { id: 'PRD-003', name: 'Enterprise Dashboard', category: 'Software', price: 499.99, unitsSold: 654, revenue: 326993.46, rating: 4.9, stock: 75 },
    { id: 'PRD-004', name: 'API Integration Pack', category: 'Add-on', price: 149.99, unitsSold: 1523, revenue: 228434.77, rating: 4.5, stock: 500 },
    { id: 'PRD-005', name: 'Custom Reports Module', category: 'Add-on', price: 99.99, unitsSold: 2104, revenue: 210378.96, rating: 4.7, stock: 300 },
    { id: 'PRD-006', name: 'Real-time Monitoring', category: 'Software', price: 349.99, unitsSold: 432, revenue: 151195.68, rating: 4.4, stock: 100 },
    { id: 'PRD-007', name: 'Team Collaboration Tool', category: 'Software', price: 179.99, unitsSold: 876, revenue: 157671.24, rating: 4.6, stock: 250 },
    { id: 'PRD-008', name: 'Security Audit Plugin', category: 'Add-on', price: 249.99, unitsSold: 321, revenue: 80246.79, rating: 4.3, stock: 180 },
    { id: 'PRD-009', name: 'Mobile Analytics App', category: 'Software', price: 129.99, unitsSold: 1890, revenue: 245681.10, rating: 4.7, stock: 400 },
    { id: 'PRD-010', name: 'White Label Solution', category: 'Enterprise', price: 999.99, unitsSold: 87, revenue: 86999.13, rating: 4.9, stock: 25 }
  ];

  // Recent orders
  const statuses = ['Completed', 'Processing', 'Shipped', 'Pending', 'Cancelled'];
  const paymentMethods = ['Credit Card', 'PayPal', 'Bank Transfer', 'Crypto', 'Apple Pay'];
  analyticsStore.recentOrders = Array.from({ length: 50 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - randomBetween(0, 30));
    return {
      id: `ORD-${String(10000 + i).padStart(5, '0')}`,