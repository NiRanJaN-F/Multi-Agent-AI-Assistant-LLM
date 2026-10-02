import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  const [navOpen, setNavOpen] = useState(false);

  const toggleNav = () => {
    setNavOpen(!navOpen);
  };

  useEffect(() => {
    localStorage.setItem('navOpen', JSON.stringify(navOpen));
  }, [navOpen]);

  useEffect(() => {
    const navOpenFromStorage = JSON.parse(localStorage.getItem('navOpen'));
    if (navOpenFromStorage) setNavOpen(navOpenFromStorage);
  }, []);

  return (
    <header className="header">
      <nav className="header__nav">
        <button onClick={toggleNav} className="header__nav-toggle">
          <span className="header__nav-toggle-line"></span>
          <span className="header__nav-toggle-line"></span>
          <span className="header__nav-toggle-line"></span>
        </button>
        <ul className="header__nav-list">
          <li className="header__nav-item">
            <Link to="/">Home</Link>
          </li>
          <li className="header__nav-item">
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li className="header__nav-item">
            <Link to="/analytics">Analytics</Link>
          </li>
          <li className="header__nav-item">
            <Link to="/settings">Settings</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;