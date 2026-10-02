import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from './components/DashboardLayout';
import Sidebar from './components/Sidebar';
import KPICards from './components/KPICards';
import DataTable from './components/DataTable';
import Charts from './components/Charts';

const STORAGE_KEY = 'dashboard-sidebar-state';
const THEME_KEY = 'dashboard-theme';

const initialKPIData = [
  {
    id: 'revenue',
    title: 'Total Revenue',
    value: '$284,500',
    change: '+12.5%',
    changeType: 'positive',
    icon: '💰',
    description: 'vs last month',
  },
  {
    id: 'users',
    title: 'Active Users',
    value: '24,589',
    change: '+8.2%',
    changeType: 'positive',
    icon: '👥',
    description: 'vs last month',
  },
  {
    id: 'orders',
    title: 'Total Orders',
    value: '3,842',
    change: '-2.4%',
    changeType: 'negative',
    icon: '📦',
    description: 'vs last month',
  },
  {
    id: 'conversion',
    title: 'Conversion Rate',
    value: '3.24%',
    change: '+0.8%',
    changeType: 'positive',
    icon: '📈',
    description: 'vs last month',
  },
];

const initialChartData = {
  revenue: [
    { name: 'Jan', value: 18500 },
    { name: 'Feb', value: 22300 },
    { name: 'Mar', value: 19800 },
    { name: 'Apr', value: 27600 },
    { name: 'May', value: 24100 },
    { name: 'Jun', value: 31200 },
    { name: 'Jul', value: 28900 },
    { name: 'Aug', value: 35400 },
    { name: 'Sep', value: 32100 },
    { name: 'Oct', value: 38700 },
    { name: 'Nov', value: 34200 },
    { name: 'Dec', value: 42500 },
  ],
  users: [
    { name: 'Jan', value: 12400 },
    { name: 'Feb', value: 14200 },
    { name: 'Mar', value: 13800 },
    { name: 'Apr', value: 16500 },
    { name: 'May', value: 15200 },
    { name: 'Jun', value: 18900 },
    { name: 'Jul', value: 17600 },
    { name: 'Aug', value: 20100 },
    { name: 'Sep', value: 19400 },
    { name: 'Oct', value: 22300 },
    { name: 'Nov', value: 21800 },
    { name: 'Dec', value: 24589 },
  ],
  category: [
    { name: 'Electronics', value: 45200 },
    { name: 'Clothing', value: 32100 },
    { name: 'Food', value: 28400 },
    { name: 'Books', value: 15600 },
    { name: 'Sports', value: 22300 },
    { name: 'Other', value: 18900 },
  ],
  ordersByDay: [
    { name: 'Mon', value: 620 },
    { name: 'Tue', value: 580 },
    { name: 'Wed', value: 710 },
    { name: 'Thu', value: 650 },
    { name: 'Fri', value: 890 },
    { name: 'Sat', value: 740 },
    { name: 'Sun', value: 652 },
  ],
};

const initialTableData = [
  {
    id: 1,
    customer: 'Alice Johnson',
    email: 'alice@example.com',
    order: '#ORD-7841',
    amount: 1250.0,
    status: 'Completed',
    date: '2024-01-15',
  },
  {
    id: 2,
    customer: 'Bob Smith',
    email: 'bob@example.com',
    order: '#ORD-7842',
    amount: 890.5,
    status: 'Processing',
    date: '2024-01-14',
  },
  {
    id: 3,
    customer: 'Carol Williams',
    email: 'carol@example.com',
    order: '#ORD-7843',
    amount: 2100.75,
    status: 'Completed',
    date: '2024-01-14',
  },
  {
    id: 4,
    customer: 'David Brown',
    email: 'david@example.com',
    order: '#ORD-7844',
    amount: 450.25,
    status: 'Cancelled',
    date: '2024-01-13',
  },
  {
    id: 5,
    customer: 'Eva Martinez',
    email: 'eva@example.com',
    order: '#ORD-7845',
    amount: 3200.0,
    status: 'Completed',
    date: '2024-01-13',
  },
  {
    id: 6,
    customer: 'Frank Lee',
    email: 'frank@example.com',
    order: '#ORD-7846',
    amount: 780.0,
    status: 'Processing',
    date: '2024-01-12',
  },
  {
    id: 7,
    customer: 'Grace Kim',
    email: 'grace@example.com',
    order: '#ORD-7847',
    amount: 1560.5,
    status: 'Completed',
    date: '2024-01-12',
  },
  {
    id: 8,
    customer: 'Henry Davis',
    email: 'henry@example.com',
    order: '#ORD-7848',
    amount: 920.0,
    status: 'Shipped',
    date: '2024-01-11',
  },
  {
    id: 9,
    customer: 'Iris Chen',
    email: 'iris@example.com',
    order: '#ORD-7849',
    amount: 2450.25,
    status: 'Completed',
    date: '2024-01-11',
  },
  {
    id: