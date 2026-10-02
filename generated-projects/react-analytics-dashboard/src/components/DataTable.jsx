import React, { useState, useEffect } from 'react';

export default function DataTable({ data = [], title = "Recent Transactions" }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Initialize Lucide icons on render/update
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [data, searchTerm, statusFilter, sortField, sortDirection, currentPage, activeTab]);

  // Handle sorting click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort data
  const filteredData = data.filter((item) => {
    const matchesSearch = 
      (item.id && item.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.customer && item.customer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.product && item.product.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesTab = activeTab === 'all' || (item.category && item.category.toLowerCase() === activeTab.toLowerCase());

    return matchesSearch && matchesStatus && matchesTab;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1;
  const paginatedData = sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(paginatedData.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemIds => itemIds !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status) => {
    const s = status.toLowerCase();
    if (s === 'completed' || s === 'active' || s === 'success') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {status}
        </span>
      );
    } else if (s === 'pending' || s === 'processing') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          {status}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          {status}
        </span>
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Table Header & Controls Toolbar */}
      <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i data-lucide="table" className="w-5 h-5 text-indigo-600"></i>
            {title}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage, filter, and export recent transaction records and customer orders.
          </p>
        </div>

        {/* Toolbar Action Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <div className="relative min-w-[220px]">
            <i data-lucide="search" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 pr-9 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <i data-lucide="chevron-down" className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
          </div>

          {/* Export / Action Button */}
          <button
            onClick={() => alert(`Exporting ${selectedItems.length > 0 ? selectedItems.length : filteredData.length} records...`)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <i data-lucide="download" className="w-4 h-4"></i>
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Category Tabs if applicable */}
      <div className="px-5 pt-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {['all', 'SaaS', 'E-Commerce', 'Enterprise', 'Services'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all capitalize border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-white/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bulk actions banner if items selected */}
      {selectedItems.length > 0 && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-5 py-2.5 flex items-center justify-between text-indigo-900 animate-fadeIn">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <i data-lucide="check-square" className="w-4 h-4 text-indigo-600"></i>
            <span>{selectedItems.length} item(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                alert(`Marking ${selectedItems.length} items as reviewed.`);
                setSelectedItems([]);
              }}
              className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Mark Reviewed
            </button>
            <button
              onClick={() => setSelectedItems([])}
              className="text-xs bg-white text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-50 transition"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={paginatedData.length > 0 && selectedItems.length === paginatedData.length}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
              </th>
              <th 
                onClick={() => handleSort('id')} 
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>ID</span>
                  {sortField === 'id' && (
                    <i data-lucide={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} className="w-3.5 h-3.5 text-indigo-600"></i>
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('customer')} 
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Customer</span>
                  {sortField === 'customer' && (
                    <i data-lucide={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} className="w-3.5 h-3.5 text-indigo-600"></i>
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('product')} 
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Product / Item</span>
                  {sortField === 'product' && (
                    <i data-lucide={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} className="w-3.5 h-3.5 text-indigo-600"></i>
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('amount')} 
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Amount</span>
                  {sortField === 'amount' && (
                    <i data-lucide={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} className="w-3.5 h-3.5 text-indigo-600"></i>
                  )}
                </div>
              </th>
              <th 
                onClick={() => handleSort('date')} 
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Date</span>
                  {sortField === 'date' && (
                    <i data-lucide={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} className="w-3.5 h-3.5 text-indigo-600"></i>
                  )}
                </div>
              </th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => {
                const isSelected = selectedItems.includes(row.id);
                return (
                  <tr 
                    key={row.id} 
                    className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}
                  >
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectItem(row.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-4 px-4 font-mono font-medium text-slate-600 text-xs">
                      {row.id}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                          {row.customer ? row.customer.charAt(0) : 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{row.customer}</p>
                          <p className="text-xs text-slate-400">{row.email || 'customer@nexus.io'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-slate-700">{row.product}</span>
                      {row.category && (
                        <span className="block text-xs text-slate-400">{row.category}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900 text-right">
                      ${typeof row.amount === 'number' ? row.amount.toLocaleString(undefined, {minimumFractionDigits: 2}) : row.amount}
                    </td>
                    <td className="py-4 px-4 text-slate-500 text-xs font-medium">
                      {row.date}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="View Details"
                          onClick={() => alert(`Viewing details for transaction ${row.id}`)}
                          className="p-1.5 hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 rounded-lg transition"
                        >
                          <i data-lucide="eye" className="w-4 h-4"></i>
                        </button>
                        <button
                          title="Download Receipt"
                          onClick={() => alert(`Downloading receipt for ${row.id}`)}
                          className="p-1.5 hover:bg-slate-200/60 text-slate-500 hover:text-indigo-600 rounded-lg transition"
                        >
                          <i data-lucide="download" className="w-4 h-4"></i>
                        </button>
                        <button
                          title="More Options"
                          onClick={() => alert(`Options for ${row.id}`)}
                          className="p-1.5 hover:bg-slate-200/60 text-slate-400 hover:text-slate-800 rounded-lg transition"
                        >
                          <i data-lucide="more-horizontal" className="w-4 h-4"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                      <i data-lucide="folder-search" className="w-6 h-6"></i>
                    </div>
                    <p className="text-base font-semibold text-slate-700">No matching records found</p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Try adjusting your search query, status filter, or active category tab.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Showing <strong className="text-slate-700">{paginatedData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}</strong> to <strong className="text-slate-700">{Math.min(currentPage * rowsPerPage, sortedData.length)}</strong> of <strong className="text-slate-700">{sortedData.length}</strong> results</span>
          
          <div className="flex items-center gap-1.5 ml-4">
            <span>Rows:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        {/* Page Nav Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 shadow-sm"
          >
            <i data-lucide="chevron-left" className="w-3.5 h-3.5"></i>
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1 px-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
                  currentPage === page
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 shadow-sm"
          >
            <span>Next</span>
            <i data-lucide="chevron-right" className="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    </div>
  );
}