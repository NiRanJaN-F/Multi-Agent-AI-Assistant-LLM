import React, { useState, useEffect } from 'react';

export default function TransactionList({ transactions, onDelete, onUpdate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Extract unique categories for filtering
  const categories = [...new Set(transactions.map((t) => t.category))];

  // Filter and sort transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.amount.toString().includes(searchTerm);

    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || tx.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.date) - new Date(a.date);
    } else if (sortBy === 'date-asc') {
      return new Date(a.date) - new Date(b.date);
    } else if (sortBy === 'amount-desc') {
      return b.amount - a.amount;
    } else if (sortBy === 'amount-asc') {
      return a.amount - b.amount;
    }
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    // Re-initialize Lucide icons after state/render updates
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [paginatedTransactions, searchTerm, typeFilter, categoryFilter, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, categoryFilter, sortBy]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300">
      {/* Header & Controls Bar */}
      <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <i data-lucide="receipt" className="w-6 h-6 text-indigo-600"></i>
              Transaction History
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage, search, and filter your financial records
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg p-1 bg-slate-100 text-xs font-medium text-slate-600">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  typeFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter('income')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  typeFilter === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setTypeFilter('expense')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  typeFilter === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                Expenses
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Search Bar */}
          <div className="relative">
            <i data-lucide="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
            <input
              type="text"
              placeholder="Search description, amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-700 placeholder-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <i data-lucide="x" className="w-4 h-4"></i>
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="relative">
            <i data-lucide="filter" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-700 appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <i data-lucide="chevron-down" className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></i>
          </div>

          {/* Sort By */}
          <div className="relative">
            <i data-lucide="arrow-up-down" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-700 appearance-none cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
            <i data-lucide="chevron-down" className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></i>
          </div>

          {/* Reset Filters info/action */}
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-medium text-slate-500">
              Showing <strong className="text-slate-700">{filteredTransactions.length}</strong> entries
            </span>
            {(searchTerm || typeFilter !== 'all' || categoryFilter !== 'all' || sortBy !== 'date-desc') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setCategoryFilter('all');
                  setSortBy('date-desc');
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-all"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table / List View */}
      <div className="overflow-x-auto">
        {paginatedTransactions.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 border border-slate-100 shadow-inner">
              <i data-lucide="folder-search" className="w-8 h-8"></i>
            </div>
            <h4 className="text-base font-semibold text-slate-800">No transactions found</h4>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              {transactions.length === 0
                ? "You haven't added any transactions yet. Use the form above to log your first income or expense."
                : "No transactions match your current search or filter criteria. Try adjusting your filters."}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-6">Category / Description</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6 text-right">Amount</th>
                <th className="py-3 px-6 text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0 shadow-sm ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}
                        >
                          <i
                            data-lucide={
                              isIncome ? 'arrow-down-left' : 'arrow-up-right'
                            }
                            className="w-5 h-5"
                          ></i>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800 block">
                            {tx.category}
                          </span>
                          <span className="text-xs text-slate-500 block max-w-xs truncate">
                            {tx.description || 'No description provided'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isIncome ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        ></span>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 whitespace-nowrap font-medium text-xs">
                      <div className="flex items-center gap-1.5">
                        <i data-lucide="calendar" className="w-3.5 h-3.5 text-slate-400"></i>
                        {new Date(tx.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </td>
                    <td
                      className={`py-4 px-6 text-right font-bold tracking-tight whitespace-nowrap ${
                        isIncome ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {isIncome ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onDelete(tx.id)}
                          title="Delete Transaction"
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <i data-lucide="trash-2" className="w-4 h-4"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Page <strong className="text-slate-700">{currentPage}</strong> of{' '}
            <strong className="text-slate-700">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Previous
            </button>
            <div className="hidden sm:flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}