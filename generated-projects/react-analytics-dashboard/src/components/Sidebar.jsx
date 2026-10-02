import React, { useEffect } from 'react';

export default function Sidebar({ isOpen, onClose, activeTab, setActiveTab }) {
  // Navigation items grouped logically
  const navGroups = [
    {
      title: 'Overview',
      items: [
        { id: 'overview', label: 'Dashboard', icon: 'layout-dashboard', badge: null },
        { id: 'analytics', label: 'Analytics', icon: 'bar-chart-3', badge: null },
        { id: 'reports', label: 'Reports', icon: 'file-text', badge: 'New' },
      ],
    },
    {
      title: 'Management',
      items: [
        { id: 'transactions', label: 'Transactions', icon: 'credit-card', badge: '12' },
        { id: 'customers', label: 'Customers', icon: 'users', badge: null },
        { id: 'products', label: 'Products', icon: 'package', badge: null },
      ],
    },
    {
      title: 'System',
      items: [
        { id: 'integrations', label: 'Integrations', icon: 'cpu', badge: null },
        { id: 'settings', label: 'Settings', icon: 'settings', badge: null },
        { id: 'help', label: 'Help & Support', icon: 'help-circle', badge: null },
      ],
    },
  ];

  // Initialize Lucide icons on mount and tab change
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab, isOpen]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <i data-lucide="hexagon" className="w-5 h-5 fill-current"></i>
            </div>
            <div>
              <span className="font-bold text-white text-lg tracking-tight block leading-none">Nexus</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 mt-1 block">Enterprise OS</span>
            </div>
          </div>
          
          {/* Close button for mobile */}
          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <i data-lucide="x" className="w-5 h-5"></i>
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1.5">
              <h3 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                {group.title}
              </h3>
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (window.innerWidth < 1024) {
                        onClose();
                      }
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative
                      ${isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <i 
                        data-lucide={item.icon} 
                        className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`}
                      ></i>
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive 
                          ? 'bg-indigo-700 text-indigo-100' 
                          : item.badge === 'New' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-slate-800 text-slate-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {/* Active left indicator bar for subtle flair */}
                    {isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-white rounded-r-full lg:hidden" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Pro Workspace Upgrade Banner */}
        <div className="p-4 mx-4 mb-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/20 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <i data-lucide="zap" className="w-4 h-4"></i>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Nexus Pro Tier</h4>
              <p className="text-[11px] text-slate-400">Unlimited analytics data</p>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mb-3 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full w-4/5 rounded-full"></div>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">80% of 10GB used</span>
            <button className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors flex items-center gap-1">
              Upgrade <i data-lucide="arrow-right" className="w-3 h-3"></i>
            </button>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                alt="Sarah Jenkins" 
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/30"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900"></div>
            </div>
            <div className="leading-tight">
              <h4 className="text-sm font-medium text-white truncate max-w-[120px]">Sarah Jenkins</h4>
              <span className="text-xs text-slate-400 truncate max-w-[120px] block">sarah@nexus.io</span>
            </div>
          </div>
          <button 
            onClick={() => alert('Logging out of Nexus OS...')}
            title="Log Out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
          >
            <i data-lucide="log-out" className="w-4 h-4"></i>
          </button>
        </div>
      </aside>
    </>
  );
}