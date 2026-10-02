import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const kpiData = [
  {
    id: 'revenue',
    title: 'Total Revenue',
    value: '$284,520',
    change: 12.5,
    period: 'vs last month',
    icon: '💰',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    sparklineData: [
      { month: 'Jan', value: 18000 },
      { month: 'Feb', value: 22000 },
      { month: 'Mar', value: 19500 },
      { month: 'Apr', value: 27000 },
      { month: 'May', value: 31000 },
      { month: 'Jun', value: 28452 },
    ],
  },
  {
    id: 'users',
    title: 'Active Users',
    value: '14,832',
    change: 8.2,
    period: 'vs last month',
    icon: '👥',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    sparklineData: [
      { month: 'Jan', value: 11200 },
      { month: 'Feb', value: 12100 },
      { month: 'Mar', value: 11800 },
      { month: 'Apr', value: 13200 },
      { month: 'May', value: 14100 },
      { month: 'Jun', value: 14832 },
    ],
  },
  {
    id: 'orders',
    title: 'Total Orders',
    value: '3,672',
    change: -2.4,
    period: 'vs last month',
    icon: '📦',
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-200',
    sparklineData: [
      { month: 'Jan', value: 620 },
      { month: 'Feb', value: 580 },
      { month: 'Mar', value: 610 },
      { month: 'Apr', value: 640 },
      { month: 'May', value: 615 },
      { month: 'Jun', value: 612 },
    ],
  },
  {
    id: 'conversion',
    title: 'Conversion Rate',
    value: '3.24%',
    change: 1.8,
    period: 'vs last month',
    icon: '📈',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    sparklineData: [
      { month: 'Jan', value: 2.8 },
      { month: 'Feb', value: 2.9 },
      { month: 'Mar', value: 3.0 },
      { month: 'Apr', value: 3.1 },
      { month: 'May', value: 3.15 },
      { month: 'Jun', value: 3.24 },
    ],
  },
  {
    id: 'avgOrder',
    title: 'Avg. Order Value',
    value: '$77.48',
    change: -0.6,
    period: 'vs last month',
    icon: '🛒',
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    sparklineData: [
      { month: 'Jan', value: 78.2 },
      { month: 'Feb', value: 79.1 },
      { month: 'Mar', value: 78.8 },
      { month: 'Apr', value: 78.0 },
      { month: 'May', value: 77.9 },
      { month: 'Jun', value: 77.48 },
    ],
  },
  {
    id: 'satisfaction',
    title: 'Satisfaction Score',
    value: '4.8/5',
    change: 3.1,
    period: 'vs last month',
    icon: '⭐',
    color: 'from-cyan-500 to-sky-600',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-200',
    sparklineData: [
      { month: 'Jan', value: 4.5 },
      { month: 'Feb', value: 4.6 },
      { month: 'Mar', value: 4.55 },
      { month: 'Apr', value: 4.7 },
      { month: 'May', value: 4.75 },
      { month: 'Jun', value: 4.8 },
    ],
  },
];

const KPICard = ({ kpi, onCardClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [animateValue, setAnimateValue] = useState(0);

  const isPositive = kpi.change >= 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateValue(1);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
    if (onCardClick) {
      onCardClick(kpi.id);
    }
  };

  const formatSparklineValue = (value) => {
    if (kpi.id === 'conversion') return `${value}%`;
    if (kpi.id === 'avgOrder') return `$${value}`;
    if (kpi.id === 'satisfaction') return `${value}/5`;
    if (kpi.id === 'users' || kpi.id === 'orders') return value.toLocaleString();
    return `$${value.toLocaleString()}`;
  };

  return (
    <div
      className={`relative bg-white rounded-2xl border transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
        isHovered
          ? `shadow-lg ${kpi.borderColor} scale-[1.02]`
          : 'shadow-sm border-gray-200'
      } ${isExpanded ? 'col-span-full lg:col-span-2' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`${kpi.title}: ${kpi.value}, ${isPositive ? '