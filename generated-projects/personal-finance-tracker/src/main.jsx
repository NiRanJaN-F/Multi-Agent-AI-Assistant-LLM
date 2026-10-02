import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// ==========================================
// API SERVICE (src/services/api.js)
// ==========================================
const API_BASE = '/api';

const api = {
  async getTransactions() {
    try {
      const res = await fetch(`${API_BASE}/transactions`);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return await res.json();
    } catch (err) {
      console.warn('API error, falling back to localStorage mock:', err);
      return JSON.parse(localStorage.getItem('pf_transactions') || '[]');
    }
  },

  async addTransaction(tx) {
    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx),
      });
      if (!res.ok) throw new Error('Failed to add transaction');
      return await res.json();
    } catch (err) {
      console.warn('API error, saving to localStorage:', err);
      const items = JSON.parse(localStorage.getItem('pf_transactions') || '[]');
      const newTx = { ...tx, id: Date.now() };
      items.unshift(newTx);
      localStorage.setItem('pf_transactions', JSON.stringify(items));
      return { id: newTx.id, success: true };
    }
  },

  async deleteTransaction(id) {
    try {
      const res = await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      return await res.json();
    } catch (err) {
      console.warn('API error, deleting from localStorage:', err);
      let items = JSON.parse(localStorage.getItem('pf_transactions') || '[]');
      items = items.filter(i => i.id !== Number(id) && i.id !== id);
      localStorage.setItem('pf_transactions', JSON.stringify(items));
      return { success: true };
    }
  },

  async getBudgets() {
    try {
      const res = await fetch(`${API_BASE}/budgets`);
      if (!res.ok) throw new Error('Failed to fetch budgets');
      return await res.json();
    } catch (err) {
      return JSON.parse(localStorage.getItem('pf_budgets') || JSON.stringify([
        { category: 'Food & Dining', limit_amount: 600 },
        { category: 'Housing', limit_amount: 1500 },
        { category: 'Entertainment', limit_amount: 300 },
        { category: 'Utilities', limit_amount: 250 }
      ]));
    }
  },

  async saveBudget(budget) {
    try {
      const res = await fetch(`${API_BASE}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budget),
      });
      if (!res.ok) throw new Error('Failed to save budget');
      return await res.json();
    } catch (err) {
      let budgets = JSON.parse(localStorage.getItem('pf_budgets') || '[]');
      const idx = budgets.findIndex(b => b.category === budget.category);
      if (idx >= 0) budgets[idx].limit_amount = Number(budget.limit_amount);
      else budgets.push(budget);
      localStorage.setItem('pf_budgets', JSON.stringify(budgets));
      return { success: true };
    }
  },

  async getSummary() {
    try {
      const res = await fetch(`${API_BASE}/summary`);
      if (!res.ok) throw new Error('Failed to fetch summary');
      return await res.json();
    } catch (err) {
      const items = JSON.parse(localStorage.getItem('pf_transactions') || '[]');
      let total_income = 0;
      let total_expense = 0;
      const category_breakdown = {};

      items.forEach(item => {
        const amt = Number(item.amount);
        if (item.type === 'income') {
          total_income += amt;
        } else {
          total_expense += amt;
          category_breakdown[item.category] = (category_breakdown[item.category] || 0) + amt;
        }
      });

      return {
        total_income,
        total_expense,
        balance: total_income - total_expense,
        category_breakdown
      };
    }
  }
};

// Seed initial localStorage data if empty
if (!localStorage.getItem('pf_transactions')) {
  const seed = [
    { id: 1, type: 'income', amount: 4500, category: 'Salary', date: new Date().toISOString().split('T')[0], description: 'Monthly Tech Corp Payroll' },
    { id: 2, type: 'expense', amount: 1200, category: 'Housing', date: new Date().toISOString().split('T')[0], description: 'Apartment Rent' },
    { id: 3, type: 'expense', amount: 85.50, category: 'Food & Dining', date: new Date().toISOString().split('T')[0], description: 'Whole Foods Market' },
    { id: 4, type: 'expense', amount: 45.00, category: 'Transportation', date: new Date().toISOString().split('T')[0], description: 'Uber Rides' },
    { id: 5, type: 'income', amount: 350, category: 'Freelance', date: new Date().toISOString().split('T')[0], description: 'UI Design Consultation' },
    { id: 6, type: 'expense', amount: 15.99, category: 'Entertainment', date: new Date().toISOString().split('T')[0], description: 'Netflix Subscription' }
  ];
  localStorage.setItem('pf_transactions', JSON.stringify(seed));
}

// ==========================================
// COMPONENTS
// ==========================================

// 1. Navbar (src/components/Navbar.jsx)
function Navbar({ onOpenAddModal, searchTerm, setSearchTerm, activeTab, setActiveTab }) {
  return (
    <nav className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 text-slate-950 font-bold text-xl">
            <i data-lucide="wallet" className="w-6 h-6"></i>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              ApexFinance
            </span>
            <span className="hidden sm:block text-xs text-slate-400 font-medium">Wealth & Expense Tracker</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'}`}
          >
            <i data-lucide="layout-dashboard" className="w-4 h-4"></i> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('transactions')} 
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'transactions' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'}`}
          >
            <i data-lucide="receipt" className="w-4 h-4"></i> Transactions
          </button>
        </div>

        {/* Search & Action */}
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block w-48 lg:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <i data-lucide="search" className="w-4 h-4"></i>
            </span>
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            onClick={onOpenAddModal}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <i data-lucide="plus" className="w-4 h-4 stroke-[3]"></i>
            <span>Add Transaction</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

// 2. Dashboard (src/components/Dashboard.jsx)
function Dashboard({ summary, transactions, budgets, onUpdateBudget }) {
  const [editingBudgetCategory, setEditingBudgetCategory] = useState(null);
  const [tempLimit, setTempLimit] = useState('');

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt || 0);
  };

  const handleSaveBudget = (cat) => {
    if (!isNaN(tempLimit) && tempLimit !== '') {
      onUpdateBudget(cat, Number(tempLimit));
    }
    setEditingBudgetCategory(null);
    setTempLimit('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Financial Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">Total Balance</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <i data-lucide="dollar-sign" className="w-5 h-5"></i>
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold tracking-tight text-white">
            {formatCurrency(summary.balance)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <i data-lucide="trending-up" className="w-3.5 h-3.5"></i> Net lifetime capital
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">Monthly Income</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <i data-lucide="arrow-down-left" className="w-5 h-5"></i>
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold tracking-tight text-white">
            {formatCurrency(summary.total_income)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-blue-400 font-medium">
            <i data-lucide="shield-check" className="w-3.5 h-3.5"></i> Verified inflows
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">Monthly Expenses</span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <i data-lucide="arrow-up-right" className="w-5 h-5"></i>
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold tracking-tight text-white">
            {formatCurrency(summary.total_expense)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-rose-400 font-medium">
            <i data-lucide="activity" className="w-3.5 h-3.5"></i> Outgoing cashflow
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Budget Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Chart Section (2 cols wide) */}
        <div className="lg:col-span-2">
          <CategoryChart breakdown={summary.category_breakdown || {}} />
        </div>

        {/* Budget Summary Section (1 col wide) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <i data-lucide="pie-chart" className="w-5 h-5 text-emerald-400"></i> Monthly Budgets
            </h2>
            <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">Limits</span>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[340px] pr-1">
            {budgets.map((b) => {
              const spent = (summary.category_breakdown && summary.category_breakdown[b.category]) || 0;
              const pct = Math.min(Math.round((spent / b.limit_amount) * 100), 100);
              const isOver = spent > b.limit_amount;

              return (
                <div key={b.category} className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-semibold text-sm text-slate-200">{b.category}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isOver ? 'text-rose-400' : 'text-slate-400'}`}>
                        {formatCurrency(spent)} / {formatCurrency(b.limit_amount)}
                      </span>
                      <button 
                        onClick={() => { setEditingBudgetCategory(b.category); setTempLimit(b.limit_amount); }}
                        className="text-slate-500 hover:text-emerald-400 transition-colors"
                        title="Edit Budget Limit"
                      >
                        <i data-lucide="settings" className="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>

                  {editingBudgetCategory === b.category && (
                    <div className="mt-3 flex items-center gap-2 animate-fadeIn">
                      <input 
                        type="number"
                        value={tempLimit}
                        onChange={(e) => setTempLimit(e.target.value)}
                        placeholder="New limit"
                        className="w-full bg-slate-900 border border-slate-700 px-3 py-1 rounded text-xs text-white"
                      />
                      <button 
                        onClick={() => handleSaveBudget(b.category)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-3 py-1 rounded text-xs"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setEditingBudgetCategory(null)}
                        className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Recent Activity Quick Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <i data-lucide="history" className="w-5 h-5 text-emerald-400"></i> Recent Activities
          </h2>
          <span className="text-xs text-slate-400">Latest 5 Transactions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 text-xs uppercase text-slate-400 bg-slate-950/40">
              <tr>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {transactions.slice(0, 5).map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${tx.type === 'income' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                    {tx.description || 'Untitled Transaction'}
                  </td>
                  <td className="py-3 px-4"><span className="bg-slate-800 px-2.5 py-1 rounded-full text-xs text-slate-300">{tx.category}</span></td>
                  <td className="py-3 px-4 text-slate-400">{tx.date}</td>
                  <td className={`py-3 px-4 text-right font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
                    {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-slate-500">No transactions recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 3. CategoryChart (src/components/CategoryChart.jsx)
function CategoryChart({ breakdown }) {
  const categories = Object.keys(breakdown);
  const values = Object.values(breakdown);
  const maxVal = Math.max(...values, 1);

  const colors = [
    'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 
    'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-rose-500'
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <i data-lucide="bar-chart-3" className="w-5 h-5 text-emerald-400"></i> Expense Breakdown by Category
          </h2>
          <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">Analytics</span>
        </div>

        {categories.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm">
            <i data-lucide="pie-chart" className="w-12 h-12 mb-2 stroke-1"></i>
            No expense data available for breakdown.
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((cat, idx) => {
              const val = breakdown[cat];
              const percentage = Math.round((val / maxVal) * 100);
              const colorClass = colors[idx % colors.length];

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-200">{cat}</span>
                    <span className="font-bold text-white">${val.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
                      style={{ width: `${Math.max(percentage, 4)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>Updated real-time</span>
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <i data-lucide="check-circle-2" className="w-3.5 h-3.5"></i> All systems operational
        </span>
      </div>
    </div>
  );
}

// 4. TransactionForm (src/components/TransactionForm.jsx)
function TransactionForm({ isOpen, onClose, onAdd }) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const categoriesMap = {
    expense: ['Food & Dining', 'Housing', 'Transportation', 'Entertainment', 'Utilities', 'Shopping', 'Healthcare', 'Other'],
    income: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other']
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }

    onAdd({
      type,
      amount: Number(amount),
      category,
      date,
      description: description || (type === 'income' ? 'Income' : 'Expense')
    });

    // Reset form
    setAmount('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i data-lucide="plus-circle" className="w-6 h-6 text-emerald-400"></i> New Transaction
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <i data-lucide="x" className="w-5 h-5"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategory('Food & Dining'); }}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${type === 'expense' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategory('Salary'); }}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${type === 'income' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Income
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Amount ($)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">$</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-lg font-bold"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm"
            >
              {categoriesMap[type].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
            <input
              type="text"
              placeholder="e.g. Grocery run, Client invoice..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <i data-lucide="check" className="w-5 h-5 stroke-[3]"></i> Record Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 5. TransactionList (src/components/TransactionList.jsx)
function TransactionList({ transactions, onDelete, searchTerm, setSearchTerm }) {
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = ['All', 'Food & Dining', 'Housing', 'Transportation', 'Entertainment', 'Utilities', 'Shopping', 'Healthcare', 'Salary', 'Freelance', 'Investments', 'Gifts', 'Other'];

  const filtered = transactions.filter((tx) => {
    const matchesSearch = (tx.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (tx.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i data-lucide="receipt" className="w-6 h-6 text-emerald-400"></i> All Transactions
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage, filter and audit your entire financial history.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Types</option>
            <option value="income">Income Only</option>
            <option value="expense">Expense Only</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat === 'All' ? 'all' : cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="border-b border-slate-800 text-xs uppercase text-slate-400 bg-slate-950/60">
            <tr>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Description</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4 text-right">Amount</th>
              <th className="py-3.5 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filtered.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    <i data-lucide={tx.type === 'income' ? 'arrow-down-left' : 'arrow-up-right'} className="w-3.5 h-3.5"></i>
                    {tx.type}
                  </span>
                </td>
                <td className="py-4 px-4 font-semibold text-white">{tx.description || '—'}</td>
                <td className="py-4 px-4"><span className="bg-slate-800 px-2.5 py-1 rounded-full text-xs text-slate-300">{tx.category}</span></td>
                <td className="py-4 px-4 text-slate-400 text-xs">{tx.date}</td>
                <td className={`py-4 px-4 text-right font-bold text-base ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
                  {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                </td>
                <td className="py-4 px-4 text-center">
                  <button
                    onClick={() => onDelete(tx.id)}
                    className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                    title="Delete Transaction"
                  >
                    <i data-lucide="trash-2" className="w-4 h-4"></i>
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-12 text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <i data-lucide="folder-search" className="w-10 h-10 stroke-1"></i>
                    <span>No transactions matched your search criteria.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 6. Main App Component (src/App.jsx)
function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0, category_breakdown: {} });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    const [txs, buds, summ] = await Promise.all([
      api.getTransactions(),
      api.getBudgets(),
      api.getSummary()
    ]);
    setTransactions(txs);
    setBudgets(buds);
    setSummary(summ);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Trigger Lucide icons refresh after renders
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  const handleAddTransaction = async (newTx) => {
    await api.addTransaction(newTx);
    await loadData();
    showToast('Transaction successfully recorded!');
  };

  const handleDeleteTransaction = async (id) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await api.deleteTransaction(id);
      await loadData();
      showToast('Transaction deleted.');
    }
  };

  const handleUpdateBudget = async (category, limit_amount) => {
    await api.saveBudget({ category, limit_amount });
    await loadData();
    showToast(`Budget for ${category} updated!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Inter',sans-serif] selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <i data-lucide="check-circle" className="w-5 h-5"></i>
          <span>{toast}</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        onOpenAddModal={() => setIsAddModalOpen(true)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            summary={summary}
            transactions={transactions}
            budgets={budgets}
            onUpdateBudget={handleUpdateBudget}
          />
        )}
        {activeTab === 'transactions' && (
          <TransactionList
            transactions={transactions}
            onDelete={handleDeleteTransaction}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        )}
      </main>

      {/* Add Transaction Modal */}
      <TransactionForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddTransaction}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} ApexFinance Architecture. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Security Terms</span>
            <span className="hover:text-white cursor-pointer transition-colors">API Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ==========================================
// RENDER ENTRY POINT (src/main.jsx)
// ==========================================
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}