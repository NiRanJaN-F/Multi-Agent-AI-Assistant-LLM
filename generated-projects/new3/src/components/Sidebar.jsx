import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

/**
 * Sidebar component for the analytics dashboard.
 *
 * Features:
 * - Collapsible/expandable with state persisted in localStorage.
 * - Responsive: collapses automatically on small screens.
 * - Navigation links using NavLink for active styling.
 * - Accessible toggle button with aria attributes.
 */
const Sidebar = () => {
  const STORAGE_KEY = 'sidebar-collapsed';

  // Initialize collapsed state from localStorage or default to false
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });

  // Persist collapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed);
  }, [collapsed]);

  // Toggle collapsed state
  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  // Close sidebar on small screens when a link is clicked
  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setCollapsed(true);
    }
  };

  // Navigation items
  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Reports', path: '/reports' },
    { name: 'Settings', path: '/settings' },
  ];

  return (
    <aside
      id="sidebar"
      className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}
      aria-label="Main navigation"
    >
      <button
        id="sidebar-toggle-btn"
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
      >
        {/* Simple icon representation */}
        <span className="toggle-icon">{collapsed ? '☰' : '✕'}</span>
      </button>

      <nav className="sidebar-nav" aria-label="Primary">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
                onClick={handleLinkClick}
              >
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;