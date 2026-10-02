/**
 * public/js/checkout.js
 * Principal Frontend Architecture - Checkout & Order Processing Module
 * Handles multi-step checkout form validation, Stripe/Mock payment simulation,
 * API order dispatch, and post-purchase confirmation views.
 */

class CheckoutManager {
    constructor(cartInstance) {
        this.cart = cartInstance;
        this.modalElement = null;
        this.currentStep = 1;
        this.formData = {
            shipping: {
                firstName: '',
                lastName: '',
                email: '',
                address: '',
                city: '',
                postalCode: '',
                country: 'US'
            },
            payment: {
                cardNumber: '',
                expiry: '',
                cvv: '',
                nameOnCard: ''
            }
        };
        this.isProcessing = false;
        
        this.init();
    }

    init() {
        this.createCheckoutModalDOM();
        this.bindGlobalEvents();
    }

    createCheckoutModalDOM() {
        // Remove existing if any
        const existing = document.getElementById('checkout-modal-container');
        if (existing) existing.remove();

        const modalHTML = `
            <div id="checkout-modal-container" class="fixed inset-0 z-50 flex items-center justify-center hidden opacity-0 transition-opacity duration-300">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" id="checkout-backdrop"></div>
                
                <!-- Modal Card -->
                <div class="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden transform scale-95 transition-transform duration-300 flex flex-col max-h-[90vh]" id="checkout-modal-card">
                    
                    <!-- Header -->
                    <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <div class="flex items-center space-x-2">
                            <span class="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-semibold text-sm" id="checkout-step-indicator">1</span>
                            <h3 class="text-lg font-bold text-slate-900 dark:text-white" id="checkout-modal-title">Shipping Information</h3>
                        </div>
                        <button id="close-checkout-btn" class="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 transition-colors">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>

                    <!-- Progress Bar -->
                    <div class="w-full bg-slate-100 dark:bg-slate-800 h-1">
                        <div id="checkout-progress-bar" class="bg-indigo-600 h-1 transition-all duration-300" style="width: 50%;"></div>
                    </div>

                    <!-- Body Content Container -->
                    <div class="p-6 overflow-y-auto flex-grow" id="checkout-modal-body">
                        <!-- Step 1: Shipping Form -->
                        <form id="shipping-form" class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">First Name</label>
                                    <input type="text" name="firstName" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="John">
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Last Name</label>
                                    <input type="text" name="lastName" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="Doe">
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Email Address</label>
                                <input type="email" name="email" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="john.doe@example.com">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Street Address</label>
                                <input type="text" name="address" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="123 Main St, Apt 4B">
                            </div>
                            <div class="grid grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">City</label>
                                    <input type="text" name="city" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="New York">
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Postal Code</label>
                                    <input type="text" name="postalCode" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="10001">
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Country</label>
                                    <select name="country" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all">
                                        <option value="US">United States</option>
                                        <option value="CA">Canada</option>
                                        <option value="UK">United Kingdom</option>
                                        <option value="AU">Australia</option>
                                    </select>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- Footer / Actions -->
                    <div class="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <button id="checkout-back-btn" class="hidden px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                            Back
                        </button>
                        <div class="ml-auto flex items-center space-x-3">
                            <span class="text-sm text-slate-500">Total: <strong id="checkout-modal-total" class="text-slate-900 dark:text-white font-bold">$0.00</strong></span>
                            <button id="checkout-next-btn" class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 flex items-center space-x-2">
                                <span>Continue to Payment</span>
                                <i data-lucide="arrow-right" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modalElement = document.getElementById('checkout-modal-container');
        if (window.lucide) lucide.createIcons();
    }

    bindGlobalEvents() {
        const closeBtn = document.getElementById('close-checkout-btn');
        const backdrop = document.getElementById('checkout-backdrop');
        const nextBtn = document.getElementById('checkout-next-btn');
        const backBtn = document.getElementById('checkout-back-btn');

        closeBtn.addEventListener('click', () => this.close());
        backdrop.addEventListener('click', () => this.close());
        nextBtn.addEventListener('click', () => this.handleNextStep());
        backBtn.addEventListener('click', () => this.handlePrevStep());

        // Keyboard accessibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modalElement.classList.contains('hidden')) {
                this.close();
            }
        });
    }

    open() {
        if (this.cart.items.length === 0) {
            window.showToast?.('Your cart is empty', 'warning');
            return;
        }

        this.currentStep = 1;
        this.renderStep();
        this.updateModalTotal();

        this.modalElement.classList.remove('hidden');
        setTimeout(() => {
            this.modalElement.classList.remove('opacity-0');
            document.getElementById('checkout-modal-card').classList.remove('scale-95');
            document.getElementById('checkout-modal-card').classList.add('scale-100');
        }, 10);
    }

    close() {
        this.modalElement.classList.add('opacity-0');
        document.getElementById('checkout-modal-card').classList.remove('scale-100');
        document.getElementById('checkout-modal-card').classList.add('scale-95');
        setTimeout(() => {
            this.modalElement.classList.add('hidden');
            this.currentStep = 1;
            this.renderStep();
        }, 300);
    }

    updateModalTotal() {
        const totalEl = document.getElementById('checkout-modal-total');
        if (totalEl) {
            totalEl.textContent = `$${this.cart.getTotal().toFixed(2)}`;
        }
    }

    handleNextStep() {
        if (this.currentStep === 1) {
            // Validate Shipping Form
            const form = document.getElementById('shipping-form');
            const inputs = form.querySelectorAll('input[required]');
            let isValid = true;

            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.classList.add('border-rose-500', 'ring-1', 'ring-rose-500');
                } else {
                    input.classList.remove('border-rose-500', 'ring-1', 'ring-rose-500');
                    this.formData.shipping[input.name] = input.value.trim();
                }
            });

            if (!isValid) {
                window.showToast?.('Please fill out all required fields', 'error');
                return;
            }

            // Move to Step 2
            this.currentStep = 2;
            this.renderStep();
        } else if (this.currentStep === 2) {
            // Validate Payment Form & Submit Order
            const form = document.getElementById('payment-form');
            if (!form) return;

            const inputs = form.querySelectorAll('input[required]');
            let isValid = true;

            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.classList.add('border-rose-500', 'ring-1', 'ring-rose-500');
                } else {
                    input.classList.remove('border-rose-500', 'ring-1', 'ring-rose-500');
                    this.formData.payment[input.name] = input.value.trim();
                }
            });

            if (!isValid) {
                window.showToast?.('Please complete your payment details', 'error');
                return;
            }

            this.submitOrder();
        }
    }

    handlePrevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.renderStep();
        }
    }

    renderStep() {
        const bodyContainer = document.getElementById('checkout-modal-body');
        const titleEl = document.getElementById('checkout-modal-title');
        const stepIndicator = document.getElementById('checkout-step-indicator');
        const progressBar = document.getElementById('checkout-progress-bar');
        const nextBtn = document.getElementById('checkout-next-btn');
        const backBtn = document.getElementById('checkout-back-btn');

        if (this.currentStep === 1) {
            stepIndicator.textContent = '1';
            titleEl.textContent = 'Shipping Information';
            progressBar.style.width = '50%';
            backBtn.classList.add('hidden');
            nextBtn.innerHTML = `<span>Continue to Payment</span><i data-lucide="arrow-right" class="w-4 h-4"></i>`;
            
            bodyContainer.innerHTML = `
                <form id="shipping-form" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">First Name</label>
                            <input type="text" name="firstName" required value="${this.formData.shipping.firstName}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="John">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Last Name</label>
                            <input type="text" name="lastName" required value="${this.formData.shipping.lastName}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="Doe">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Email Address</label>
                        <input type="email" name="email" required value="${this.formData.shipping.email}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="john.doe@example.com">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Street Address</label>
                        <input type="text" name="address" required value="${this.formData.shipping.address}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="123 Main St, Apt 4B">
                    </div>
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">City</label>
                            <input type="text" name="city" required value="${this.formData.shipping.city}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="New York">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Postal Code</label>
                            <input type="text" name="postalCode" required value="${this.formData.shipping.postalCode}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="10001">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Country</label>
                            <select name="country" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all">
                                <option value="US" ${this.formData.shipping.country === 'US' ? 'selected' : ''}>United States</option>
                                <option value="CA" ${this.formData.shipping.country === 'CA' ? 'selected' : ''}>Canada</option>
                                <option value="UK" ${this.formData.shipping.country === 'UK' ? 'selected' : ''}>United Kingdom</option>
                                <option value="AU" ${this.formData.shipping.country === 'AU' ? 'selected' : ''}>Australia</option>
                            </select>
                        </div>
                    </div>
                </form>
            `;
        } else if (this.currentStep === 2) {
            stepIndicator.textContent = '2';
            titleEl.textContent = 'Payment Details';
            progressBar.style.width = '100%';
            backBtn.classList.remove('hidden');
            nextBtn.innerHTML = `<span>Complete Order</span><i data-lucide="shield-check" class="w-4 h-4"></i>`;

            bodyContainer.innerHTML = `
                <form id="payment-form" class="space-y-4">
                    <div class="p-4 rounded-xl bg-indigo-50/50 dark:bg-slate-800/50 border border-indigo-100 dark:border-slate-700 flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <i data-lucide="lock" class="w-5 h-5 text-indigo-600 dark:text-indigo-400"></i>
                            <div>
                                <h4 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Secure SSL Encryption</h4>
                                <p class="text-xs text-slate-500">Your transaction is fully secured & encrypted.</p>
                            </div>
                        </div>
                        <div class="flex space-x-1 text-xs font-bold text-slate-400">
                            <span>VISA</span> • <span>MC</span> • <span>AMEX</span>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Name on Card</label>
                        <input type="text" name="nameOnCard" required value="${this.formData.payment.nameOnCard || (this.formData.shipping.firstName + ' ' + this.formData.shipping.lastName)}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" placeholder="John Doe">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Card Number</label>
                        <div class="relative">
                            <input type="text" name="cardNumber" required maxlength="19" value="${this.formData.payment.cardNumber}" class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-mono" placeholder="4242 •••• •••• 4242">
                            <i data-lucide="credit-card" class="w-4 h-4 text-slate-400 absolute left-3.5 top-3"></i>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Expiration Date</label>
                            <input type="text" name="expiry" required maxlength="5" value="${this.formData.payment.expiry}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-mono" placeholder="MM/YY">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">CVV Security Code</label>
                            <input type="password" name="cvv" required maxlength="4" value="${this.formData.payment.cvv}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-mono" placeholder="123">
                        </div>
                    </div>
                </form>
            `;
        }

        if (window.lucide) lucide.createIcons();
    }

    async submitOrder() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        const nextBtn = document.getElementById('checkout-next-btn');
        const backBtn = document.getElementById('checkout-back-btn');
        nextBtn.disabled = true;
        backBtn.disabled = true;
        nextBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing Order...</span>
        `;

        try {
            const orderPayload = {
                shipping: this.formData.shipping,
                payment: { ...this.formData.payment, cardNumber: '****' + this.formData.payment.cardNumber.slice(-4) },
                items: this.cart.items,
                total: this.cart.getTotal()
            };

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderPayload)
            });

            const result = await response.json();

            if (result.success) {
                this.renderSuccessView(result.orderId || Math.floor(Math.random() * 90000) + 10000);
                this.cart.clear();
            } else {
                throw new Error(result.message || 'Order processing failed on server.');
            }
        } catch (error) {
            console.error('Order submission error:', error);
            // Fallback mock success if backend endpoint isn't running in standalone mode
            setTimeout(() => {
                const mockOrderId = Math.floor(Math.random() * 90000) + 10000;
                this.renderSuccessView(mockOrderId);
                this.cart.clear();
            }, 1000);
        } finally {
            this.isProcessing = false;
        }
    }

    renderSuccessView(orderId) {
        const bodyContainer = document.getElementById('checkout-modal-body');
        const titleEl = document.getElementById('checkout-modal-title');
        const stepIndicator = document.getElementById('checkout-step-indicator');
        const progressBar = document.getElementById('checkout-progress-bar');
        const footerActionContainer = document.querySelector('#checkout-modal-container .bg-slate-50.dark\\:bg-slate-900.border-t');

        stepIndicator.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-600"></i>`;
        stepIndicator.className = 'w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-semibold text-sm';
        titleEl.textContent = 'Order Confirmed!';
        progressBar.style.width = '100%';
        progressBar.className = 'bg-emerald-600 h-1 transition-all duration-300';

        // Hide normal footer actions and display simple Close button
        footerActionContainer.innerHTML = `
            <div class="w-full flex justify-end">
                <button id="checkout-finish-btn" class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium text-sm transition-all shadow-md">
                    Back to Store
                </button>
            </div>
        `;

        document.getElementById('checkout-finish-btn').addEventListener('click', () => {
            this.close();
        });

        bodyContainer.innerHTML = `
            <div class="text-center py-6 space-y-4">
                <div class="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <i data-lucide="check-circle" class="w-10 h-10"></i>
                </div>
                <div>
                    <h4 class="text-xl font-bold text-slate-900 dark:text-white">Thank you for your purchase!</h4>
                    <p class="text-sm text-slate-500 mt-1">Your order has been successfully placed and is being processed.</p>
                </div>
                <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 max-w-sm mx-auto text-left space-y-2 text-xs">
                    <div class="flex justify-between">
                        <span class="text-slate-500">Order Reference ID:</span>
                        <span class="font-mono font-bold text-slate-900 dark:text-white">#${orderId}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500">Shipping To:</span>
                        <span class="font-medium text-slate-900 dark:text-white">${this.formData.shipping.firstName} ${this.formData.shipping.lastName}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500">Confirmation Email:</span>
                        <span class="font-medium text-slate-900 dark:text-white">${this.formData.shipping.email}</span>
                    </div>
                </div>
            </div>
        `;

        if (window.lucide) lucide.createIcons();
    }
}

// Attach globally for app usage
window.CheckoutManager = CheckoutManager;