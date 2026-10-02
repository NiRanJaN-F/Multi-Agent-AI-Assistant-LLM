/**
 * api.js
 * Principal Frontend Architecture & Senior UI/UX Designer implementation.
 * Handles all backend communication with fallback safety for seamless client-side resilience.
 */

const API_BASE = '/api';

class ApiClient {
    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
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
            
            // If API route is missing (e.g. static preview or dev mode before backend starts),
            // throw to trigger client-side fallback simulation if desired, or let server handle.
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.warn(`[API Client Warning] Failed to reach ${url}:`, error.message);
            throw error;
        }
    }

    /**
     * Fetch all products from the store catalog
     */
    async getProducts() {
        return this.request('/products', {
            method: 'GET'
        });
    }

    /**
     * Fetch current user shopping cart state
     */
    async getCart() {
        return this.request('/cart', {
            method: 'GET'
        });
    }

    /**
     * Add or update an item in the cart
     * @param {number|string} productId 
     * @param {number} quantity 
     */
    async addToCart(productId, quantity = 1) {
        return this.request('/cart', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity })
        });
    }

    /**
     * Remove a specific product from the cart
     * @param {number|string} productId 
     */
    async removeFromCart(productId) {
        return this.request(`/cart/${productId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Complete checkout process with shipping & payment payload
     * @param {Object} checkoutData 
     */
    async checkout(checkoutData) {
        return this.request('/checkout', {
            method: 'POST',
            body: JSON.stringify(checkoutData)
        });
    }
}

// Export global singleton instance
window.api = new ApiClient();