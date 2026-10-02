/**
 * public/js/checkout.js
 * Principal Frontend Architecture & UI/UX Implementation
 * Component: CheckoutModal, OrderConfirmation, Payment Processing
 */

class CheckoutManager {
    constructor() {
        this.isOpen = false;
        this.step = 1; // 1: Shipping, 2: Payment, 3: Confirmation
        this.orderData = {
            shipping: {
                firstName: '',
                lastName: '',
                email: '',
                address: '',
                city: '',
                postalCode: '',
                country: 'United States'
            },
            payment: {
                cardNumber: '',
                cardHolder: '',
                expiry: '',
                cvv: ''
            },
            result: null
        };
        
        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        // Ensure checkout modal root container exists
        if (!document.getElementById('checkout-modal-container')) {
            const container = document.createElement('div');
            container.id = 'checkout-modal-container';
            document.body.appendChild(container);
        }
        this.renderModalShell();
    }

    renderModalShell() {
        const container = document.getElementById('checkout-modal-container');
        container.innerHTML = `
            <div id="checkout-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transform scale-95 transition-transform duration-300">
                    
                    <!-- Modal Header -->
                    <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold">
                                <i data-lucide="shield-check" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-slate-900">Secure Checkout</h3>
                                <p class="text-xs text-slate-500" id="checkout-step-subtitle">Step 1 of 2: Shipping Details</p>
                            </div>
                        </div>
                        <button id="close-checkout-btn" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>

                    <!-- Step Progress Indicator -->
                    <div id="checkout-progress-bar" class="px-6 pt-4 bg-slate-50/50 flex items-center space-x-4 border-b border-slate-100 pb-4">
                        <div class="flex items-center space-x-2 text-indigo-600 font-medium text-sm" id="progress-step-1">
                            <span class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">1</span>
                            <span>Shipping</span>
                        </div>
                        <div class="w-8 h-px bg-slate-300"></div>
                        <div class="flex items-center space-x-2 text-slate-400 font-medium text-sm" id="progress-step-2">
                            <span class="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs">2</span>
                            <span>Payment</span>
                        </div>
                    </div>

                    <!-- Modal Body / Content Area -->
                    <div id="checkout-body" class="p-6 overflow-y-auto flex-1">
                        <!-- Dynamically injected step views -->
                    </div>

                    <!-- Modal Footer -->
                    <div id="checkout-footer" class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <button id="checkout-back-btn" class="hidden px-4 py-2.5 border border-slate-300 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-100 transition-colors">
                            Back
                        </button>
                        <div class="ml-auto flex items-center space-x-3">
                            <button id="checkout-cancel-btn" class="px-4 py-2.5 text-slate-600 font-medium text-sm hover:text-slate-900 transition-colors">
                                Cancel
                            </button>
                            <button id="checkout-next-btn" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center space-x-2">
                                <span>Continue to Payment</span>
                                <i data-lucide="arrow-right" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        `;
        
        lucide.createIcons();
    }

    bindEvents() {
        document.getElementById('close-checkout-btn').addEventListener('click', () => this.close());
        document.getElementById('checkout-cancel-btn').addEventListener('click', () => this.close());
        document.getElementById('checkout-next-btn').addEventListener('click', () => this.handleNextStep());
        document.getElementById('checkout-back-btn').addEventListener('click', () => this.handlePrevStep());

        // Close on backdrop click
        document.getElementById('checkout-modal').addEventListener('click', (e) => {
            if (e.target.id === 'checkout-modal') {
                this.close();
            }
        });
    }

    open() {
        if (!window.cart || window.cart.items.length === 0) {
            window.showToast('Your cart is empty!', 'error');
            return;
        }

        this.isOpen = true;
        this.step = 1;
        this.renderStep();

        const modal = document.getElementById('checkout-modal');
        modal.classList.remove('opacity-0', 'pointer-events-none');
        modal.querySelector('.transform').classList.remove('scale-95');
        modal.querySelector('.transform').classList.add('scale-100');
    }

    close() {
        this.isOpen = false;
        const modal = document.getElementById('checkout-modal');
        modal.classList.add('opacity-0', 'pointer-events-none');
        modal.querySelector('.transform').classList.remove('scale-100');
        modal.querySelector('.transform').classList.add('scale-95');
    }

    renderStep() {
        const bodyEl = document.getElementById('checkout-body');
        const subtitleEl = document.getElementById('checkout-step-subtitle');
        const nextBtn = document.getElementById('checkout-next-btn');
        const backBtn = document.getElementById('checkout-back-btn');
        const progressBar = document.getElementById('checkout-progress-bar');
        const footerEl = document.getElementById('checkout-footer');

        // Update progress visuals
        const step1Indicator = document.getElementById('progress-step-1');
        const step2Indicator = document.getElementById('progress-step-2');

        if (this.step === 1) {
            subtitleEl.textContent = 'Step 1 of 2: Shipping Destination';
            progressBar.style.display = 'flex';
            footerEl.style.display = 'flex';
            backBtn.classList.add('hidden');
            nextBtn.innerHTML = `<span>Continue to Payment</span><i data-lucide="arrow-right" class="w-4 h-4"></i>`;

            step1Indicator.className = 'flex items-center space-x-2 text-indigo-600 font-medium text-sm';
            step1Indicator.children[0].className = 'w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs';
            
            step2Indicator.className = 'flex items-center space-x-2 text-slate-400 font-medium text-sm';
            step2Indicator.children[0].className = 'w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs';

            bodyEl.innerHTML = `
                <form id="shipping-form" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">First Name</label>
                            <input type="text" id="ship-firstName" required value="${this.orderData.shipping.firstName}" placeholder="John" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-sm">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Last Name</label>
                            <input type="text" id="ship-lastName" required value="${this.orderData.shipping.lastName}" placeholder="Doe" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-sm">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
                        <input type="email" id="ship-email" required value="${this.orderData.shipping.email}" placeholder="john.doe@example.com" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-sm">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Street Address</label>
                        <input type="text" id="ship-address" required value="${this.orderData.shipping.address}" placeholder="123 Main St, Apt 4B" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-sm">
                    </div>
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">City</label>
                            <input type="text" id="ship-city" required value="${this.orderData.shipping.city}" placeholder="San Francisco" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-sm">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Postal Code</label>
                            <input type="text" id="ship-postal" required value="${this.orderData.shipping.postalCode}" placeholder="94107" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-sm">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Country</label>
                            <select id="ship-country" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-sm bg-white">
                                <option value="United States">United States</option>
                                <option value="Canada">Canada</option>
                                <option value="United Kingdom">United Kingdom</option>
                                <option value="Australia">Australia</option>
                            </select>
                        </div>
                    </div>
                </form>
            `;
        } else if (this.step === 2) {
            subtitleEl.textContent = 'Step 2 of 2: Secure Payment';
            progressBar.style.display = 'flex';
            footerEl.style.display = 'flex';
            backBtn.classList.remove('hidden');
            nextBtn.innerHTML = `<span>Complete Order</span><i data-lucide="check-circle" class="w-4 h-4"></i>`;

            step1Indicator.className = 'flex items-center space-x-2 text-slate-400 font-medium text-sm';
            step1Indicator.children[0].className = 'w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs';
            
            step2Indicator.className = 'flex items-center space-x-2 text-indigo-600 font-medium text-sm';
            step2Indicator.children[0].className = 'w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs';

            const subtotal = window.cart.getSubtotal();
            const shippingCost = subtotal > 50 ? 0 : 5.99;
            const total = (subtotal + shippingCost).toFixed(2);

            bodyEl.innerHTML = `
                <div class="space-y-6">
                    <!-- Order summary snippet -->
                    <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                            <p class="text-xs text-slate-500 font-medium">Total Amount Due</p>
                            <p class="text-xl font-bold text-slate-900">$${total}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-xs text-slate-500 font-medium">Items in Cart</p>
                            <p class="text-sm font-semibold text-slate-700">${window.cart.getTotalItems()} units</p>
                        </div>
                    </div>

                    <form id="payment-form" class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Cardholder Name</label>
                            <input type="text" id="pay-holder" required value="${this.orderData.payment.cardHolder}" placeholder="John Doe" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-sm">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Card Number</label>
                            <div class="relative">
                                <input type="text" id="pay-number" required maxlength="19" value="${this.orderData.payment.cardNumber}" placeholder="4242 •••• •••• 4242" class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-sm font-mono">
                                <i data-lucide="credit-card" class="w-4 h-4 text-slate-400 absolute left-3 top-3.5"></i>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Expiration Date</label>
                                <input type="text" id="pay-expiry" required maxlength="5" value="${this.orderData.payment.expiry}" placeholder="MM/YY" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-sm font-mono">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">CVV Security Code</label>
                                <input type="password" id="pay-cvv" required maxlength="4" value="${this.orderData.payment.cvv}" placeholder="123" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-sm font-mono">
                            </div>
                        </div>
                    </form>
                </div>
            `;
        } else if (this.step === 3) {
            // Confirmation view
            subtitleEl.textContent = 'Order Confirmed Successfully';
            progressBar.style.display = 'none';
            footerEl.style.display = 'none';

            const res = this.orderData.result;
            bodyEl.innerHTML = `
                <div class="text-center py-6 space-y-4">
                    <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <i data-lucide="check" class="w-8 h-8"></i>
                    </div>
                    <div class="space-y-1">
                        <h4 class="text-xl font-bold text-slate-900">Thank you for your order!</h4>
                        <p class="text-sm text-slate-500">We have received your payment and are getting your items ready.</p>
                    </div>

                    <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 max-w-sm mx-auto text-left space-y-2">
                        <div class="flex justify-between text-xs">
                            <span class="text-slate-500">Order ID:</span>
                            <span class="font-mono font-semibold text-slate-800">${res.orderId}</span>
                        </div>
                        <div class="flex justify-between text-xs">
                            <span class="text-slate-500">Total Charged:</span>
                            <span class="font-semibold text-slate-800">$${res.total.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between text-xs">
                            <span class="text-slate-500">Shipping To:</span>
                            <span class="font-medium text-slate-800 truncate max-w-[180px]">${this.orderData.shipping.address}, ${this.orderData.shipping.city}</span>
                        </div>
                    </div>

                    <button id="checkout-finish-btn" class="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl shadow-lg transition-all">
                        Continue Shopping
                    </button>
                </div>
            `;

            document.getElementById('checkout-finish-btn').addEventListener('click', () => {
                this.close();
                window.cart.clear();
            });
        }

        lucide.createIcons();
    }

    handleNextStep() {
        if (this.step === 1) {
            // Validate shipping form
            const firstName = document.getElementById('ship-firstName').value.trim();
            const lastName = document.getElementById('ship-lastName').value.trim();
            const email = document.getElementById('ship-email').value.trim();
            const address = document.getElementById('ship-address').value.trim();
            const city = document.getElementById('ship-city').value.trim();
            const postalCode = document.getElementById('ship-postal').value.trim();
            const country = document.getElementById('ship-country').value;

            if (!firstName || !lastName || !email || !address || !city || !postalCode) {
                window.showToast('Please fill out all required shipping fields.', 'error');
                return;
            }

            this.orderData.shipping = { firstName, lastName, email, address, city, postalCode, country };
            this.step = 2;
            this.renderStep();
        } else if (this.step === 2) {
            // Validate payment form and submit to backend API
            const cardHolder = document.getElementById('pay-holder').value.trim();
            const cardNumber = document.getElementById('pay-number').value.trim();
            const expiry = document.getElementById('pay-expiry').value.trim();
            const cvv = document.getElementById('pay-cvv').value.trim();

            if (!cardHolder || !cardNumber || !expiry || !cvv) {
                window.showToast('Please complete all payment fields.', 'error');
                return;
            }

            this.orderData.payment = { cardHolder, cardNumber, expiry, cvv };
            this.submitOrder();
        }
    }

    handlePrevStep() {
        if (this.step > 1) {
            this.step--;
            this.renderStep();
        }
    }

    async submitOrder() {
        const nextBtn = document.getElementById('checkout-next-btn');
        nextBtn.disabled = true;
        nextBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing...</span>
        `;

        try {
            const subtotal = window.cart.getSubtotal();
            const shippingCost = subtotal > 50 ? 0 : 5.99;
            const total = subtotal + shippingCost;

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shipping: this.orderData.shipping,
                    items: window.cart.items,
                    total: total
                })
            });

            if (!response.ok) {
                throw new Error('Checkout request failed on server.');
            }

            const data = await response.json();
            
            if (data.success) {
                this.orderData.result = {
                    orderId: data.orderId || 'ORD-' + Math.floor(10000 + Math.random() * 90000),
                    total: data.total || total
                };
                this.step = 3;
                this.renderStep();
                window.showToast('Payment successful!', 'success');
            } else {
                throw new Error('Server declined payment transaction.');
            }
        } catch (err) {
            console.error(err);
            window.showToast('Checkout failed. Please check network connectivity.', 'error');
            nextBtn.disabled = false;
            nextBtn.innerHTML = `<span>Complete Order</span><i data-lucide="check-circle" class="w-4 h-4"></i>`;
            lucide.createIcons();
        }
    }
}

// Instantiate global checkout manager
window.checkoutManager = new CheckoutManager();