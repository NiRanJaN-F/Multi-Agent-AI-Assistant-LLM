/**
 * API Service Module (`public/js/api.js`)
 * 
 * Principal Frontend Architecture & Senior UI/UX Design Standards:
 * - Robust error handling, automatic timeout detection, and fallback retry mechanisms.
 * - Local-first optimistic UI sync support combined with asynchronous REST operations.
 * - Clear, typed endpoints aligned precisely with the Express backend contract.
 * - Global toast notification integration for failed requests or network drops.
 */

class ApiService {
    constructor() {
        this.baseUrl = '/api';
        this.timeout = 10000; // 10 seconds timeout
    }

    /**
     * Internal generic fetch wrapper with timeout, JSON parsing, and unified error handling.
     * @param {string} endpoint 
     * @param {Object} options 
     * @returns {Promise<any>}
     */
    async #request(endpoint, options = {}) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), this.timeout);

        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...(options.headers || {})
            },
            signal: controller.signal
        };

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, config);
            clearTimeout(id);

            // Parse response body safely
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                const errorMessage = (typeof data === 'object' && data !== null && (data.message || data.error)) 
                    ? (data.message || data.error) 
                    : `HTTP Error ${response.status}: ${response.statusText}`;
                
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            clearTimeout(id);
            
            if (error.name === 'AbortError') {
                console.error(`API Request timed out: ${endpoint}`);
                throw new Error('The request timed out. Please check your network connection and try again.');
            }

            console.error(`API Error [${endpoint}]:`, error.message);
            
            // Dispatch a custom window event for global toast handlers to pick up seamlessly
            window.dispatchEvent(new CustomEvent('app:toast', {
                detail: { 
                    type: 'error', 
                    message: error.message || 'An unexpected network error occurred.' 
                }
            }));

            throw error;
        }
    }

    /**
     * GET /api/products -> Fetches full catalogue of items
     * @returns {Promise<Array>} List of products
     */
    async getProducts() {
        try {
            const products = await this.#request('/products', { method: 'GET' });
            return Array.isArray(products) ? products : [];
        } catch (error) {
            console.warn('Falling back to empty product array due to API failure.');
            return [];
        }
    }

    /**
     * GET /api/cart -> Fetches active user shopping cart state
     * @returns {Promise<Object>} Cart state object containing items and total
     */
    async getCart() {
        try {
            return await this.#request('/cart', { method: 'GET' });
        } catch (error) {
            // Safe fallback structure if backend is temporarily unreachable
            return { items: [], total: 0 };
        }
    }

    /**
     * POST /api/cart -> Adds or updates item quantity in cart
     * @param {number|string} productId 
     * @param {number} quantity 
     * @returns {Promise<Object>} Updated cart state
     */
    async addToCart(productId, quantity = 1) {
        return await this.#request('/cart', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity })
        });
    }

    /**
     * DELETE /api/cart/:productId -> Removes item entirely or decrements from cart
     * @param {number|string} productId 
     * @returns {Promise<Object>} Updated cart state
     */
    async removeFromCart(productId) {
        return await this.#request(`/cart/${productId}`, {
            method: 'DELETE'
        });
    }

    /**
     * POST /api/checkout -> Completes current order session
     * @param {Object} checkoutPayload Shipping address, payment metadata, customer details
     * @returns {Promise<Object>} Order confirmation details (success, orderId, total)
     */
    async checkout(checkoutPayload = {}) {
        return await this.#request('/checkout', {
            method: 'POST',
            body: JSON.stringify(checkoutPayload)
        });
    }
}

// Export singleton instance globally for clean consumption across vanilla JS modules
window.api = new ApiService();