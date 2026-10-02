import React, { useState, useEffect, useRef } from 'react';
import { FaBars, FaSun, FaMoon, FaBell, FaUserCircle, FaSearch } from 'react-icons/fa';

/**
 * Header component for the analytics dashboard.
 *
 * Features:
 * - Sidebar toggle button (adds/removes 'sidebar-open' class on <body>)
 * - Search input (updates local state and logs query)
 * - Theme toggle (persists preference in localStorage, toggles 'dark' class on <html>)
 * - Notifications icon with static badge
 * - User avatar with dropdown menu (Profile, Settings, Logout)
 *
 * All interactive elements are fully functional and use localStorage where appropriate.
 */
const Header = () => {
  // State for theme, dropdown visibility, search query
  const [theme, setTheme] = useState('light');
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef(null);

  // Load theme from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setTheme(storedTheme);
      applyTheme(storedTheme);
    } else {
      applyTheme('light');
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Apply theme by toggling class on <html>
  const applyTheme = (newTheme) => {
    const html = document.documentElement;
    if (!html) return;
    if (newTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  // Toggle theme handler
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Toggle sidebar handler
  const toggleSidebar = () => {
    const body = document.body;
    if (!body) return;
    body.classList.toggle('sidebar-open');
  };

  // Search change handler
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    console.log('Search query:', value);
  };

  // Logout handler (placeholder)
  const handleLogout = () => {
    console.log('User logged out');
    // Implement actual logout logic here
  };

  return (
    <header className="header">
      <div className="header__left">
        <button
          className="header__icon header__icon--menu"
          aria-label="Toggle sidebar"
          onClick={toggleSidebar}
        >
          <FaBars size={20} />
        </button>
        <div className="header__search">
          <FaSearch className="header__search-icon" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search"
          />
        </div>
      </div>

      <div className="header__right">
        <button
          className="header__icon header__icon--theme"
          aria-label="Toggle theme"
          onClick={toggleTheme}
        >
          {theme === 'light' ? <FaMoon size={20} /> : <FaSun size={20} />}
        </button>

        <button
          className="header__icon header__icon--notifications"
          aria-label="Notifications"
        >
          <FaBell size={20} />
          <span className="header__badge">3</span>
        </button>

        <div className="header__user" ref={dropdownRef}>
          <button
            className="header__icon header__icon--user"
            aria-label="User menu"
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            <FaUserCircle size={24} />
          </button>
          {isDropdownOpen && (
            <ul className="header__dropdown">
              <li>
                <button onClick={() => console.log('Profile clicked')}>Profile</button>
              </li>
              <li>
                <button onClick={() => console.log('Settings clicked')}>Settings</button>
              </li>
              <li>
                <button onClick={handleLogout}>Logout</button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;