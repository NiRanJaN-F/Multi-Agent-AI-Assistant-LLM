import React, { useState } from 'react';
import './Header.css';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="header">
      <nav className={`menu ${menuOpen ? 'open' : ''}`}>
        <ul>
          <li><a href="#dashboard">Dashboard</a></li>
          <li><a href="#reports">Reports</a></li>
          <li><a href="#settings">Settings</a></li>
        </ul>
        <button onClick={toggleMenu}>Menu</button>
      </nav>
      <div className="header-content">
        <h1>Analytics Dashboard</h1>
        <input type="text" placeholder="Search..." />
        <button>Search</button>
      </div>
    </header>
  );
}

export default Header;