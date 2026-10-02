import React, { useState, useEffect } from 'react';

const menuItems = [
  {
    name: 'Dashboard',
    icon: (
      <svg
        className="h-5 w-5 mr-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3v18h18V3H3zm6 6h6m-6 4h6"
        />
      </svg>
    ),
    path: '#',
  },
  {
    name: 'Analytics',
    icon: (
      <svg
        className="h-5 w-5 mr-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3v18h18V3H3zm4 4h10v10H7V7z"
        />
      </svg>
    ),
    path: '#',
  },
  {
    name: 'Users',
    icon: (
      <svg
        className="h-5 w-5 mr-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 12h14M5 16h14M5 8h14"
        />
      </svg>
    ),
    path: '#',
  },
  {
    name: 'Settings',
    icon: (
      <svg
        className="h-5 w-5 mr-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
    ),
    path: '#',
  },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(
    localStorage.getItem('sidebarActiveItem') || 'Dashboard'
  );

  useEffect(() => {
    localStorage.setItem('sidebarActiveItem', activeItem);
  }, [activeItem]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleItemClick = (name) => {
    setActiveItem(name);
    if (window.innerWidth < 768) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        type="button"
        className="fixed top-4 left-4 z-50 md:hidden text-gray-800 bg-white rounded-full p-2 shadow-md"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <nav
        className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:inset-auto md:w-64 md:h-auto`}
        aria-label="Sidebar navigation"
      >
        <div className="flex items-center justify-between px-4 py-4 md:hidden">
          <h2 className="text-xl font-semibold">Analytics</h2>
          <button
            type="button"
            className="text-gray-300 hover:text-white"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.name}>
              <button
                type="button"
                className={`flex items-center w-full px-4 py-2 text-left hover:bg-gray-700 focus:outline-none ${
                  activeItem === item.name ? 'bg-gray-700' : ''
                }`}
                onClick={() => handleItemClick(item.name)}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

export default Sidebar;