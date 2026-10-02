import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import CategoryChart from './components/CategoryChart';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import api from './services/api';

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0, category_breakdown: {} });
  const [budgets, setBudgets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [txData, sumData, budgetData] = await Promise.all([
        api.getTransactions(),
        api.getSummary(),
        api.getBudgets()
      ]);
      setTransactions(txData);
      setSummary(sumData);
      setBudgets(budgetData);
    } catch (err) {
      console.error(err);
      showToast('Failed to load financial data. Backend might be offline.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddTransaction = async (txData) => {
    try {
      await api.createTransaction(txData);
      showToast('Transaction added successfully!');
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to add transaction', 'error');
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await api.deleteTransaction(id);
      showToast('Transaction removed.');
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete transaction', 'error');
    }
  };

  const handleSaveBudget = async (category, limitAmount) => {
    try {
      await api.saveBudget({ category, limit_amount: limitAmount });
      showToast(`Budget for ${category} updated!`);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save budget', 'error');
    }
  };

  // Filter transactions by search query (description or category)
  const filteredTransactions = transactions.filter(t => {
    const q = searchQuery.toLowerCase();
    return (
      t.description?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q) ||
      t.type?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-['Inter',sans-serif]">
      {/* Navbar */}
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Hero / Welcome Greeting Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-slate-800 to-slate-900 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <i data-lucide="shield-check" className="w-3.5 h-3.5"></i>
              Secure Personal Ledger
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Financial Command Center
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base max-w-xl">
              Track your cash flow, monitor monthly budgets, and analyze category expenditures in real-time.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={loadData}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium py-2.5 px-4 rounded-xl border border-slate-700 transition shadow-sm"
            >
              <i data-lucide="refresh-cw" className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}></i>
              Refresh
            </button>
          </div>
        </div>

        {/* Dashboard Cards (Summary) */}
        <Dashboard summary={summary} />

        {/* Analytics & Budget Section (Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Category Breakdown Chart & Budgets (2 columns on lg) */}
          <div className="lg:col-span-2 bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-3xl p-6 shadow-xl flex flex-col">
            <CategoryChart summary={summary} budgets={budgets} onSaveBudget={handleSaveBudget} />
          </div>

          {/* Quick Transaction Form (1 column on lg) */}
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-3xl p-6 shadow-xl flex flex-col">
            <TransactionForm onAdd={handleAddTransaction} />
          </div>
        </div>

        {/* Transaction History Table / Feed */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-3xl p-6 shadow-xl">
          <TransactionList 
            transactions={filteredTransactions} 
            onDelete={handleDeleteTransaction} 
            searchQuery={searchQuery}
          />
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} FinTrack Pro. Built with React, Vite, Node, Express & SQLite.</p>
      </footer>

      {/* Toast Notification Popup */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium border ${
            toast.type === 'error' 
              ? 'bg-rose-950/90 border-rose-800 text-rose-200' 
              : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
          }`}>
            <i data-lucide={toast.type === 'error' ? 'alert-circle' : 'check-circle-2'} className="w-5 h-5 flex-shrink-0"></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}