<div className="layout-container">
       <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
       <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
         <header className="layout-header">
           <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle Sidebar">
             {/* hamburger icon */}
           </button>
           <h1>Analytics Dashboard</h1>
         </header>
         <main className="layout-main" onClick={isMobile ? closeSidebarOnContentClick : undefined}>
           {children}
         </main>
       </div>
     </div>