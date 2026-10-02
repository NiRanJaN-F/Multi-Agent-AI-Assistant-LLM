import React, { useState, useRef, useEffect } from 'react';

export default function Header({
  sidebarOpen,
  setSidebarOpen,
  searchQuery,
  setSearchQuery,
  onExport,
  onRefresh,
  notifications,
  userProfile,
  themeMode,
  setThemeMode
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize Lucide icons on render/update
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [notificationsOpen, profileOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 sm:px-6 lg:px-8 backdrop-blur-md transition-all">
      {/* Left side: Sidebar Toggle & Breadcrumb / Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 lg:hidden"
          aria-label="Toggle Sidebar"
        >
          <i data-lucide="menu" className="h-5 w-5"></i>
        </button>

        {/* Global Search Bar */}
        <div className="relative max-w-md w-full hidden sm:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <i data-lucide="search" className="h-4 w-4 text-slate-400"></i>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions, customers, reports..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <i data-lucide="x" className="h-4 w-4"></i>
            </button>
          )}
        </div>
      </div>

      {/* Right side Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search button toggle or input */}
        <div className="sm:hidden flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-32 sm:w-auto rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Refresh Data Button */}
        <button
          onClick={onRefresh}
          title="Refresh Data"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
        >
          <i data-lucide="refresh-cw" className="h-4 w-4"></i>
        </button>

        {/* Export Report Button */}
        <button
          onClick={onExport}
          className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
        >
          <i data-lucide="download" className="h-3.5 w-3.5 text-slate-500"></i>
          <span>Export</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            aria-label="View notifications"
          >
            <i data-lucide="bell" className="h-5 w-5"></i>
            {notifications && notifications.length > 0 && (
              <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
              </span>
            )}
          </button>

          {/* Notifications Panel */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                    {notifications?.length || 0} new
                  </span>
                </div>
                <button 
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications && notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div key={notif.id} className="flex gap-3 p-4 hover:bg-slate-50/80 transition-colors cursor-pointer">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${notif.bg || 'bg-indigo-50 text-indigo-600'}`}>
                        <i data-lucide={notif.icon || 'bell'} className="h-4 w-4"></i>
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-medium text-slate-900">{notif.title}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{notif.message}</p>
                        <p className="text-[10px] text-slate-400">{notif.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 p-2.5 text-center">
                <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  View all activity history →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative ml-1" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            aria-label="User profile menu"
          >
            <div className="relative">
              <img
                src={userProfile?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"}
                alt={userProfile?.name || "User Avatar"}
                className="h-9 w-9 rounded-xl object-cover ring-2 ring-slate-200"
              />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <div className="hidden text-left xl:block">
              <div className="text-xs font-semibold text-slate-900">{userProfile?.name || 'Sophia Williams'}</div>
              <div className="text-[10px] font-medium text-slate-500">{userProfile?.role || 'Principal Admin'}</div>
            </div>
            <i data-lucide="chevron-down" className="h-3.5 w-3.5 text-slate-400 hidden xl:block"></i>
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 divide-y divide-slate-100">
              <div className="p-4">
                <p className="text-xs font-medium text-slate-500">Signed in as</p>
                <p className="text-sm font-bold text-slate-900 truncate">{userProfile?.email || 'sophia.w@nexus.io'}</p>
              </div>

              <div className="py-1">
                <a href="#profile" className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600">
                  <i data-lucide="user" className="h-4 w-4 text-slate-400"></i>
                  Your Profile
                </a>
                <a href="#settings" className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600">
                  <i data-lucide="settings" className="h-4 w-4 text-slate-400"></i>
                  Account Settings
                </a>
                <a href="#billing" className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600">
                  <i data-lucide="credit-card" className="h-4 w-4 text-slate-400"></i>
                  Billing & Plans
                </a>
              </div>

              <div className="py-1">
                <button 
                  onClick={() => alert('Logged out successfully')} 
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                >
                  <i data-lucide="log-out" className="h-4 w-4 text-rose-500"></i>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}