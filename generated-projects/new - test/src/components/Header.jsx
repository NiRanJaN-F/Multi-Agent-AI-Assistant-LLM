import React, { useState, useEffect, useRef } from 'react';

const Header = ({ onToggleSidebar, isSidebarOpen, currentPage }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('dashboard-theme');
    return saved === 'dark';
  });
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Revenue target reached', message: 'Monthly revenue exceeded $50K goal', time: '2 min ago', read: false, type: 'success' },
    { id: 2, title: 'New user signup spike', message: '34% increase in signups today', time: '1 hour ago', read: false, type: 'info' },
    { id: 3, title: 'Server load warning', message: 'CPU usage above 85% on prod-02', time: '3 hours ago', read: true, type: 'warning' },
    { id: 4, title: 'Report generated', message: 'Weekly analytics report is ready', time: '5 hours ago', read: true, type: 'info' },
    { id: 5, title: 'Payment failed', message: 'Invoice #1042 payment declined', time: '1 day ago', read: true, type: 'error' },
  ]);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const searchSuggestions = [
    { id: 1, label: 'Revenue Overview', type: 'page', path: '/revenue' },
    { id: 2, label: 'User Analytics', type: 'page', path: '/users' },
    { id: 3, label: 'Conversion Rate', type: 'metric', path: '/metrics/conversion' },
    { id: 4, label: 'Traffic Sources', type: 'page', path: '/traffic' },
    { id: 5, label: 'Customer Segments', type: 'page', path: '/segments' },
    { id: 6, label: 'Sales Pipeline', type: 'page', path: '/pipeline' },
    { id: 7, label: 'Churn Rate', type: 'metric', path: '/metrics/churn' },
    { id: 8, label: 'Export Data', type: 'action', path: '/export' },
    { id: 9, label: 'Team Performance', type: 'page', path: '/team' },
    { id: 10, label: 'Settings', type: 'page', path: '/settings' },
  ];

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('dashboard-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('dashboard-theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const filtered = searchSuggestions.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const result = searchResults.find(r => r.label.toLowerCase() === searchQuery.toLowerCase());
      if (result) {
        window.location.hash = result.path;
      }
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✕';
      default: return 'ℹ';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const getPageTitle = () => {
    const titles = {
      'dashboard': 'Dashboard Overview',
      'analytics': 'Analytics',
      'reports': 'Reports',
      'users': 'User Management',
      'settings': 'Settings',
    };
    return titles[currentPage] || 'Dashboard Overview';
  };

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="dashboard-header" style={styles.header}>
      <div style={styles.headerLeft}>
        <button
          onClick={onToggleSidebar}
          style={styles.menuToggle}
          className="menu-toggle"
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isSidebarOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>

        <div style={styles.breadcrumb}>
          <span style={styles.breadcrumbHome}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="