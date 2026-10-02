const test = require('node:test');
const assert = require('node:assert/strict');

// Mock localStorage for Node.js environment
class LocalStorageMock {
    constructor() {
        this.store = {};
    }
    clear() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] || null;
    }
    setItem(key, value) {
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
}

global.localStorage = new LocalStorageMock();

// Replicating app core logic for integration testing
class ExpenseTrackerApp {
    constructor() {
        this.expenses = [];
        this.budgets = {};
        this.loadData();
    }

    loadData() {
        const savedExpenses = localStorage.getItem('expenses');
        const savedBudgets = localStorage.getItem('budgets');
        if (savedExpenses) {
            try { this.expenses = JSON.parse(savedExpenses); } catch(e) { this.expenses = []; }
        }
        if (savedBudgets) {
            try { this.budgets = JSON.parse(savedBudgets); } catch(e) { this.budgets = {}; }
        }
    }

    saveData() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
        localStorage.setItem('budgets', JSON.stringify(this.budgets));
    }

    addExpense(expense) {
        if (!expense.description || typeof expense.amount !== 'number' || expense.amount <= 0) {
            throw new Error('Invalid expense data');
        }
        const newExpense = {
            id: 'exp_' + Date.now() + Math.random().toString(36.substring(2, 9)),
            description: expense.description.trim(),
            amount: expense.amount,
            category: expense.category || 'General',
            date: expense.date || new Date().toISOString().split('T')[0],
            paymentMethod: expense.paymentMethod || 'Cash'
        };
        this.expenses.push(newExpense);
        this.saveData();
        return newExpense;
    }

    deleteExpense(id) {
        const index = this.expenses.findIndex(e => e.id === id);
        if (index !== -1) {
            this.expenses.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    setBudget(category, amount) {
        if (amount < 0) throw new Error('Budget cannot be negative');
        this.budgets[category] = amount;
        this.saveData();
    }

    getTotalExpenses() {
        return this.expenses.reduce((sum, e) => sum + e.amount, 0);
    }

    getExpensesByCategory(category) {
        return this.expenses.filter(e => e.category === category);
    }

    getCategoryTotal(category) {
        return this.getExpensesByCategory(category).reduce((sum, e) => sum + e.amount, 0);
    }

    checkBudgetAlerts() {
        const alerts = [];
        for (const [category, limit] of Object.entries(this.budgets)) {
            const spent = this.getCategoryTotal(category);
            if (spent >= limit) {
                alerts.push({ category, spent, limit, status: 'exceeded' });
            } else if (spent >= limit * 0.8) {
                alerts.push({ category, spent, limit, status: 'warning' });
            }
        }
        return alerts;
    }
}

test('Smart Expense Tracker Unit and Integration Test Suite', async (t) => {
    
    t.beforeEach(() => {
        localStorage.clear();
    });

    await t.test('Initialization and LocalStorage Persistence', () => {
        const app = new ExpenseTrackerApp();
        assert.deepEqual(app.expenses, []);
        assert.deepEqual(app.budgets, {});

        app.addExpense({ description: 'Coffee', amount: 4.50, category: 'Food' });
        assert.equal(app.expenses.length, 1);

        // Instantiate new tracker to verify persistence
        const appReloaded = new ExpenseTrackerApp();
        assert.equal(appReloaded.expenses.length, 1);
        assert.equal(appReloaded.expenses[0].description, 'Coffee');
    });

    await t.test('Add Expense Validation and Creation', () => {
        const app = new ExpenseTrackerApp();
        
        const validExpense = app.addExpense({
            description: 'Groceries',
            amount: 55.20,
            category: 'Food',
            date: '2023-10-01',
            paymentMethod: 'Credit Card'
        });

        assert.equal(validExpense.description, 'Groceries');
        assert.equal(validExpense.amount, 55.20);
        assert.equal(validExpense.category, 'Food');
        assert.ok(validExpense.id);

        // Invalid cases
        assert.throws(() => {
            app.addExpense({ description: '', amount: 10 });
        }, /Invalid expense data/);

        assert.throws(() => {
            app.addExpense({ description: 'Test', amount: -5 });
        }, /Invalid expense data/);
    });

    await t.test('Delete Expense Integration', () => {
        const app = new ExpenseTrackerApp();
        const exp1 = app.addExpense({ description: 'Internet', amount: 60 });
        const exp2 = app.addExpense({ description: 'Rent', amount: 1200 });

        assert.equal(app.expenses.length, 2);

        const deleted = app.deleteExpense(exp1.id);
        assert.equal(deleted, true);
        assert.equal(app.expenses.length, 1);
        assert.equal(app.expenses[0].id, exp2.id);

        const nonExistentDelete = app.deleteExpense('invalid_id');
        assert.equal(nonExistentDelete, false);
    });

    await t.test('Calculations and Totals', () => {
        const app = new ExpenseTrackerApp();
        app.addExpense({ description: 'Book', amount: 20, category: 'Education' });
        app.addExpense({ description: 'Course', amount: 80, category: 'Education' });
        app.addExpense({ description: 'Movie', amount: 15, category: 'Entertainment' });

        assert.equal(app.getTotalExpenses(), 115);
        assert.equal(app.getCategoryTotal('Education'), 100);
        assert.equal(app.getCategoryTotal('Entertainment'), 15);
        assert.equal(app.getCategoryTotal('Nonexistent'), 0);
    });

    await t.test('Budgets and Alerts Logic', () => {
        const app = new ExpenseTrackerApp();
        app.setBudget('Food', 100);
        app.setBudget('Travel', 200);

        assert.equal(app.budgets['Food'], 100);

        // Spend under budget
        app.addExpense({ description: 'Lunch', amount: 50, category: 'Food' });
        let alerts = app.checkBudgetAlerts();
        assert.equal(alerts.length, 0);

        // Spend approaching warning threshold (80%)
        app.addExpense({ description: 'Dinner', amount: 35, category: 'Food' });
        alerts = app.checkBudgetAlerts();
        assert.equal(alerts.length, 1);
        assert.equal(alerts[0].status, 'warning');

        // Spend exceeding budget
        app.addExpense({ description: 'Groceries', amount: 20, category: 'Food' });
        alerts = app.checkBudgetAlerts();
        assert.equal(alerts.length, 1);
        assert.equal(alerts[0].status, 'exceeded');
        assert.equal(alerts[0].spent, 105);
    });
});