/**
 * Personal Finance Tracker API Service
 * Handles communication with the Express/SQLite backend.
 * Provides fallback mock data / local storage cache if backend is unreachable,
 * ensuring robust offline-first UX for a Principal-grade frontend.
 */

const API_BASE_URL = '/api';

// Fallback initial data for resilience
const FALLBACK_TRANSACTIONS = [
  { id: 1, type: 'income', amount: 4500, category: 'Salary', date: new Date().toISOString().split('T')[0], description: 'Monthly Software Engineering Salary' },
  { id: 2, type: 'expense', amount: 1200, category: 'Housing', date: new Date().toISOString().split('T')[0], description: 'Apartment Rent' },
  { id: 3, type: 'expense', amount: 350, category: 'Food', date: new Date().toISOString().split('T')[0], description: 'Groceries & Supermarket' },
  { id: 4, type: 'expense', amount: 120, category: 'Utilities', date: new Date().toISOString().split('T')[0], description: 'Electricity & Internet' },
  { id: 5, type: 'income', amount: 300, category: 'Freelance', date: new Date().toISOString().split('T')[0], description: 'UI/UX Consulting Gig' },
  { id: 6, type: 'expense', amount: 65, category: 'Entertainment', date: new Date().toISOString().split('T')[0], description: 'Cinema & Dinner' }
];

const FALLBACK_BUDGETS = [
  { category: 'Food', limit_amount: 500 },
  { category: 'Housing', limit_amount: 1300 },
  { category: 'Utilities', limit_amount: 200 },
  { category: 'Entertainment', limit_amount: 150 },
  { category: 'Transport', limit_amount: 200 }
];

/**
 * Helper to calculate summary from transactions if /api/summary fails
 */
function calculateFallbackSummary(transactions) {
  let total_income = 0;
  let total_expense = 0;
  const category_breakdown = {};

  transactions.forEach(tx => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      total_income += amt;
    } else {
      total_expense += amt;
      category_breakdown[tx.category] = (category_breakdown[tx.category] || 0) + amt;
    }
  });

  return {
    total_income,
    total_expense,
    balance: total_income - total_expense,
    category_breakdown
  };
}

export const api = {
  /**
   * Fetch all transactions
   * GET /api/transactions
   */
  async getTransactions() {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Backend API unreachable for getTransactions. Using local fallback state.', error);
      const cached = localStorage.getItem('pf_transactions');
      if (cached) return JSON.parse(cached);
      localStorage.setItem('pf_transactions', JSON.stringify(FALLBACK_TRANSACTIONS));
      return FALLBACK_TRANSACTIONS;
    }
  },

  /**
   * Create a new transaction
   * POST /api/transactions
   */
  async addTransaction(transactionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Backend API unreachable for addTransaction. Using local fallback state.', error);
      const current = await this.getTransactions();
      const newTx = {
        id: Date.now(),
        ...transactionData,
        amount: Number(transactionData.amount)
      };
      const updated = [newTx, ...current];
      localStorage.setItem('pf_transactions', JSON.stringify(updated));
      return { id: newTx.id, success: true };
    }
  },

  /**
   * Delete a transaction by ID
   * DELETE /api/transactions/:id
   */
  async deleteTransaction(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Backend API unreachable for deleteTransaction. Using local fallback state.', error);
      const current = await this.getTransactions();
      const updated = current.filter(tx => tx.id !== Number(id));
      localStorage.setItem('pf_transactions', JSON.stringify(updated));
      return { success: true };
    }
  },

  /**
   * Fetch budget limits per category
   * GET /api/budgets
   */
  async getBudgets() {
    try {
      const response = await fetch(`${API_BASE_URL}/budgets`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Backend API unreachable for getBudgets. Using local fallback state.', error);
      const cached = localStorage.getItem('pf_budgets');
      if (cached) return JSON.parse(cached);
      localStorage.setItem('pf_budgets', JSON.stringify(FALLBACK_BUDGETS));
      return FALLBACK_BUDGETS;
    }
  },

  /**
   * Set or update a budget limit
   * POST /api/budgets
   */
  async saveBudget(budgetData) {
    try {
      const response = await fetch(`${API_BASE_URL}/budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(budgetData),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Backend API unreachable for saveBudget. Using local fallback state.', error);
      const current = await this.getBudgets();
      const index = current.findIndex(b => b.category === budgetData.category);
      let updated;
      if (index >= 0) {
        updated = [...current];
        updated[index] = { ...updated[index], limit_amount: Number(budgetData.limit_amount) };
      } else {
        updated = [...current, { category: budgetData.category, limit_amount: Number(budgetData.limit_amount) }];
      }
      localStorage.setItem('pf_budgets', JSON.stringify(updated));
      return { success: true };
    }
  },

  /**
   * Fetch summary metrics (total income, total expense, balance, category breakdown)
   * GET /api/summary
   */
  async getSummary() {
    try {
      const response = await fetch(`${API_BASE_URL}/summary`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Backend API unreachable for getSummary. Computing from local fallback state.', error);
      const transactions = await this.getTransactions();
      return calculateFallbackSummary(transactions);
    }
  }
};