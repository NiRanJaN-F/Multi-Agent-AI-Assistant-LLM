import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PlusCircle, 
  Trash2, 
  Tag, 
  Calendar, 
  AlertCircle, 
  DollarSign,
  PieChart as PieIcon,
  ListFilter,
  CheckCircle2,
  X
} from 'lucide-react';
import { 
  getTransactions, 
  getBudgets, 
  getSummary, 
  addTransaction, 
  deleteTransaction, 
  upsertBudget 
} from '../services/api';
import CategoryChart from './CategoryChart';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0, category_breakdown: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');
  
  // Budget Form State
  const [budgetCat, setBudgetCat] = useState('Food');
  const [budgetLimit, setBudgetLimit] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [txData, budgetData, summaryData] = await Promise.all([
        getTransactions(),
        getBudgets(),
        getSummary()
      ]);
      setTransactions(txData);
      setBudgets(budgetData);
      setSummary(summaryData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load financial data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddTransaction = async (formData) => {
    try {
      await addTransaction(formData);
      setIsAddModalOpen(false);
      showToast('Transaction recorded successfully!');
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to add transaction', 'error');
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await deleteTransaction(id);
      showToast('Transaction deleted');
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete transaction', 'error');
    }
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!budgetLimit || isNaN(budgetLimit)) return;
    try {
      await upsertBudget({ category: budgetCat, limit_amount: parseFloat(budgetLimit) });
      setIsBudgetModalOpen(false);
      setBudgetLimit('');
      showToast(`Budget for ${budgetCat} updated!`);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save budget', 'error');
    }
  };

  // Filter transactions based on category
  const filteredTransactions = filterCategory === 'ALL' 
    ? transactions 
    : transactions.filter(t => t.category.toLowerCase() === filterCategory.toLowerCase());

  // Extract unique categories for filter
  const categories = ['ALL', ...new Set(transactions.map(t => t.category))];

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Crunching your financial numbers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`flex items-center space-x-3 px-5 py-4 rounded-xl shadow-2xl text-white ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-900 border border-slate-700'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-200" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Hero Action Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wider uppercase mb-3 border border-indigo-500/30">
            Financial Command Center
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Overview & Analytics</h1>
          <p className="text-slate-400 text-sm mt-1 max-w-md">
            Monitor your income streams, manage daily expenses, and keep your monthly budget strictly on track.
          </p>
        </div>
        <div className="flex items-center space-x-3 relative z-10">
          <button
            onClick={() => setIsBudgetModalOpen(true)}
            className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-3 rounded-xl font-medium text-sm transition shadow-lg border border-slate-700"
          >
            <Tag className="w-4 h-4 text-indigo-400" />
            <span>Set Budget</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-medium text-sm transition shadow-lg shadow-indigo-600/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3 text-rose-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Balance */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-100 transition">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 transition group-hover:bg-indigo-100/60"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Net Balance</span>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              ${Number(summary.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="relative z-10 mt-4 pt-4 border-t border-slate-100 flex items-center text-xs text-slate-500">
            <span className="font-medium text-indigo-600 mr-1.5">Live calculation</span> from active logs
          </div>
        </div>

        {/* Total Income */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-100 transition">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 transition group-hover:bg-emerald-100/60"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Total Income</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
              +${Number(summary.total_income || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="relative z-10 mt-4 pt-4 border-t border-slate-100 flex items-center text-xs text-slate-500">
            All recorded earnings
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between relative overflow-hidden group hover:border-rose-100 transition">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -z-0 transition group-hover:bg-rose-100/60"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Total Expenses</span>
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-rose-600 tracking-tight">
              -${Number(summary.total_expense || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="relative z-10 mt-4 pt-4 border-t border-slate-100 flex items-center text-xs text-slate-500">
            All recorded spending
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category breakdown visual representation */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <PieIcon className="w-5 h-5 text-indigo-600" />
                <span>Expense Breakdown</span>
              </h2>
            </div>
            <CategoryChart categoryBreakdown={summary.category_breakdown || {}} />
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Budget Statuses</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {budgets.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No budgets defined yet. Click "Set Budget" to track limits.</p>
              ) : (
                budgets.map((b, idx) => {
                  const spent = summary.category_breakdown?.[b.category] || 0;
                  const pct = Math.min(Math.round((spent / b.limit_amount) * 100), 100);
                  const isOver = spent > b.limit_amount;
                  return (
                    <div key={idx} className="text-xs space-y-1">
                      <div className="flex justify-between font-medium text-slate-700">
                        <span>{b.category}</span>
                        <span className={isOver ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                          ${spent} / ${b.limit_amount}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <ListFilter className="w-5 h-5 text-indigo-600" />
              <span>Recent Transactions</span>
            </h2>
            
            {/* Category Filter Pills */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-2 sm:pb-0 max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    filterCategory === cat 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <TransactionList 
              transactions={filteredTransactions} 
              onDelete={handleDeleteTransaction} 
            />
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-1">New Transaction</h3>
            <p className="text-xs text-slate-400 mb-6">Record an income earning or expense payment instantly.</p>
            
            <TransactionForm 
              onSubmit={handleAddTransaction} 
              onCancel={() => setIsAddModalOpen(false)} 
            />
          </div>
        </div>
      )}

      {/* Set Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
            <button 
              onClick={() => setIsBudgetModalOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Set Category Budget</h3>
            <p className="text-xs text-slate-400 mb-6">Define a maximum monthly spending limit for a specific category.</p>
            
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Category Name</label>
                <input 
                  type="text" 
                  value={budgetCat} 
                  onChange={(e) => setBudgetCat(e.target.value)}
                  required
                  placeholder="e.g., Food, Rent, Entertainment"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Monthly Limit ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-400 font-bold">$</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={budgetLimit} 
                    onChange={(e) => setBudgetLimit(e.target.value)}
                    required
                    placeholder="500.00"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}