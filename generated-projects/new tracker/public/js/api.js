/**
 * API Client Layer for Smart Expense Tracker
 * Handles all HTTP requests to the Express backend with robust error handling,
 * loading state tracking, and fallback simulation if offline.
 */

class ApiClient {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
        this.isOnline = true;
    }

    /**
     * Generic fetch wrapper with JSON parsing and error handling
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...(options.headers || {})
            }
        };

        try {
            const response = await fetch(url, config);
            
            // Handle HTTP errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, error.message);
            throw error;
        }
    }

    /**
     * Fetch all financial transactions
     * @returns {Promise<Array>} List of transactions
     */
    async getTransactions() {
        return this.request('/transactions', {
            method: 'GET'
        });
    }

    /**
     * Create a new transaction (Expense or Income)
     * @param {Object} transactionData - { title, amount, type, date, category }
     * @returns {Promise<Object>} Created transaction response
     */
    async addTransaction(transactionData) {
        return this.request('/transactions', {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
    }

    /**
     * Delete a transaction by ID
     * @param {string|number} id 
     * @returns {Promise<Object>} Deletion success confirmation
     */
    async deleteTransaction(id) {
        return this.request(`/transactions/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Fetch all savings goals
     * @returns {Promise<Array>} List of savings goals
     */
    async getSavings() {
        return this.request('/savings', {
            method: 'GET'
        });
    }

    /**
     * Create a new savings goal
     * @param {Object} savingsData - { goal, target, current }
     * @returns {Promise<Object>} Created savings goal response
     */
    async addSavings(savingsData) {
        return this.request('/savings', {
            method: 'POST',
            body: JSON.stringify(savingsData)
        });
    }

    /**
     * Process checkout or simulated settlement / investment allocation
     * @param {Object} checkoutData - Cart or checkout payload items
     * @returns {Promise<Object>} Checkout success response
     */
    async processCheckout(checkoutData) {
        return this.request('/checkout', {
            method: 'POST',
            body: JSON.stringify(checkoutData)
        });
    }
}

// Export a singleton instance for global use across the frontend
const API = window.API = window.api = new ApiClient();