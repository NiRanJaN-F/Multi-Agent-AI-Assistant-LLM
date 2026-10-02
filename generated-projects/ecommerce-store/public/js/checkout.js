/**
 * public/js/checkout.js
 * Principal Frontend Architecture & UI/UX Implementation
 * Component: CheckoutModal & OrderConfirmation Flow
 * 
 * Handles multi-step checkout form validation, secure payment simulation,
 * API order payload dispatch to POST /api/orders, and high-conversion success confirmation UI.
 */

class CheckoutManager {
    constructor() {
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
        
        // Bind methods
        this.init = this.init.bind(this);
        this.handleCheckoutOpen = this.handleCheckoutOpen.bind(this);
        this.handleCheckoutClose = this.handleCheckoutClose.bind(this);
        this.render = this.render.bind(this);
    }

    init() {
        // Create modal container if not exists
        if (!document.getElementById('checkout-modal-root')) {
            const root = document.createElement('div');
            root.id = 'checkout-modal-root';
            document.body.appendChild(root);
        }
        this.render();
        this.attachGlobalListeners();
    }

    attachGlobalListeners() {
        // Listen for custom event triggered from cart.js
        window.addEventListener('open-checkout', () => {
            this.handleCheckoutOpen();
        });

        // Esc key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('checkout-modal');
                if (modal && !modal.classList.contains('hidden') && !this.isProcessing) {
                    this.handleCheckoutClose();
                }
            }
        });
    }

    handleCheckoutOpen() {
        const cart = window.store?.cart || [];
        if (cart.length === 0) {
            window.showToast?.('Your cart is empty. Add items before checking out.', 'error');
            return;
        }

        this.currentStep = 1;
        this.isProcessing = false;
        const modal = document.getElementById('checkout-modal');
        const backdrop = document.getElementById('checkout-backdrop');
        const panel = document.getElementById('checkout-panel');

        if (modal && backdrop && panel) {
            modal.classList.remove('hidden');
            // Trigger reflow
            void modal.offsetWidth;
            
            backdrop.classList.remove('opacity-0');
            backdrop.classList.add('opacity-100');
            
            panel.classList.remove('translate-y-full', 'sm:scale-95', 'opacity-0');
            panel.classList.add('translate-y-0', 'sm:scale-100', 'opacity-100');
            
            document.body.style.overflow = 'hidden';
            this.updateStepView();
            
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
    }

    handleCheckoutClose() {
        const modal = document.getElementById('checkout-modal');
        const backdrop = document.getElementById('checkout-backdrop');
        const panel = document.getElementById('checkout-panel');

        if (modal && backdrop && panel) {
            backdrop.classList.remove('opacity-100');
            backdrop.classList.add('opacity-0');
            
            panel.classList.remove('translate-y-0', 'sm:scale-100', 'opacity-100');
            panel.classList.add('translate-y-full', 'sm:scale-95', 'opacity-0');

            setTimeout(() => {
                modal.classList.add('hidden');
                document.body.style.overflow = '';
            }, 300);
        }
    }

    validateStep(step) {
        if (step === 1) {
            const firstName = document.getElementById('shipping-firstname')?.value.trim();
            const lastName = document.getElementById('shipping-lastname')?.value.trim();
            const email = document.getElementById('shipping-email')?.value.trim();
            const address = document.getElementById('shipping-address')?.value.trim();
            const city = document.getElementById('shipping-city')?.value.trim();
            const postalCode = document.getElementById('shipping-postal')?.value.trim();

            if (!firstName || !lastName || !email || !address || !city || !postalCode) {
                window.showToast?.('Please fill in all required shipping fields.', 'error');
                return false;
            }

            // Basic email validation regex
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                window.showToast?.('Please enter a valid email address.', 'error');
                return false;
            }

            this.formData.shipping = { firstName, lastName, email, address, city, postalCode };
            return true;
        }

        if (step === 2) {
            const cardNumber = document.getElementById('payment-card')?.value.replace(/\s+/g, '');
            const expiry = document.getElementById('payment-expiry')?.value.trim();
            const cvv = document.getElementById('payment-cvv')?.value.trim();
            const nameOnCard = document.getElementById('payment-name')?.value.trim();

            if (!cardNumber || !expiry || !cvv || !nameOnCard) {
                window.showToast?.('Please complete all payment fields.', 'error');
                return false;
            }

            if (cardNumber.length < 15 || cardNumber.length > 16) {
                window.showToast?.('Please enter a valid 15 or 16-digit card number.', 'error');
                return false;
            }

            if (!/^\d{2}\/\d{2}$/.test(expiry)) {
                window.showToast?.('Expiry date must be in MM/YY format.', 'error');
                return false;
            }

            if (cvv.length < 3 || cvv.length > 4) {
                window.showToast?.('Please enter a valid security code (CVV).', 'error');
                return false;
            }

            this.formData.payment = { cardNumber, expiry, cvv, nameOnCard };
            return true;
        }

        return true;
    }

    nextStep() {
        if (this.validateStep(this.currentStep)) {
            if (this.currentStep < 2) {
                this.currentStep++;
                this.updateStepView();
            } else if (this.currentStep === 2) {
                this.submitOrder();
            }
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepView();
        }
    }

    updateStepView() {
        // Toggle step indicators
        const step1Indicator = document.getElementById('step-1-indicator');
        const step2Indicator = document.getElementById('step-2-indicator');
        const step1Content = document.getElementById('checkout-step-1');
        const step2Content = document.getElementById('checkout-step-2');
        const nextBtnText = document.getElementById('checkout-next-btn-text');
        const nextBtnIcon = document.getElementById('checkout-next-icon');

        if (!step1Indicator || !step2Indicator || !step1Content || !step2Content) return;

        if (this.currentStep === 1) {
            step1Indicator.className = 'flex items-center gap-2 text-indigo-600 font-semibold text-sm';
            step1Indicator.querySelector('div').className = 'w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold';
            
            step2Indicator.className = 'flex items-center gap-2 text-gray-400 font-medium text-sm';
            step2Indicator.querySelector('div').className = 'w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold';

            step1Content.classList.remove('hidden');
            step2Content.classList.add('hidden');

            if (nextBtnText) nextBtnText.textContent = 'Continue to Payment';
            if (nextBtnIcon) nextBtnIcon.style.display = 'inline-block';
        } else if (this.currentStep === 2) {
            step1Indicator.className = 'flex items-center gap-2 text-gray-500 font-medium text-sm';
            step1Indicator.querySelector('div').className = 'w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold';
            step1Indicator.querySelector('div').innerHTML = '<i data-lucide="check" class="w-4 h-4"></i>';

            step2Indicator.className = 'flex items-center gap-2 text-indigo-600 font-semibold text-sm';
            step2Indicator.querySelector('div').className = 'w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold';

            step1Content.classList.add('hidden');
            step2Content.classList.remove('hidden');

            if (nextBtnText) nextBtnText.textContent = 'Complete Secure Order';
            if (nextBtnIcon) nextBtnIcon.style.display = 'none';
        }

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    async submitOrder() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        const nextBtn = document.getElementById('checkout-next-btn');
        const prevBtn = document.getElementById('checkout-prev-btn');
        
        if (nextBtn) {
            nextBtn.disabled = true;
            nextBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Secure Order...
            `;
        }
        if (prevBtn) prevBtn.disabled = true;

        const cart = window.store?.cart || [];
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingFee = subtotal > 50 ? 0 : 5.99;
        const tax = subtotal * 0.08;
        const total = subtotal + shippingFee + tax;

        const orderPayload = {
            items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
            shipping: this.formData.shipping,
            paymentMethod: 'card',
            subtotal: parseFloat(subtotal.toFixed(2)),
            shippingFee: parseFloat(shippingFee.toFixed(2)),
            tax: parseFloat(tax.toFixed(2)),
            total: parseFloat(total.toFixed(2))
        };

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderPayload)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();

            if (result.success) {
                // Clear cart via global store
                if (window.store && typeof window.store.clearCart === 'function') {
                    window.store.clearCart();
                }

                // Render Success Confirmation View
                this.renderOrderConfirmation(result);
            } else {
                throw new Error(result.message || 'Order processing failed.');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            window.showToast?.('Order submission failed. Please try again.', 'error');
            this.isProcessing = false;
            
            if (nextBtn) {
                nextBtn.disabled = false;
                nextBtn.innerHTML = `<span>Complete Secure Order</span>`;
            }
            if (prevBtn) prevBtn.disabled = false;
        }
    }

    renderOrderConfirmation(result) {
        const bodyContainer = document.getElementById('checkout-modal-body');
        if (!bodyContainer) return;

        const orderId = result.orderId || 'ORD-' + Math.floor(100000 + Math.random() * 900000);
        const totalAmount = result.total ? `$${result.total.toFixed(2)}` : '$0.00';
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 3);
        const formattedDate = deliveryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

        bodyContainer.innerHTML = `
            <div class="text-center py-8 px-4 animate-fade-in">
                <div class="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-emerald-50">
                    <i data-lucide="check-circle-2" class="w-10 h-10"></i>
                </div>
                <span class="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">Order Confirmed</span>
                <h3 class="text-2xl font-bold text-gray-900 tracking-tight mb-2">Thank you for your purchase!</h3>
                <p class="text-sm text-gray-600 max-w-md mx-auto mb-6">
                    We’ve received your order and our fulfillment team is already getting it ready. A confirmation email has been dispatched to <span class="font-medium text-gray-900">${this.formData.shipping.email || 'your email'}</span>.
                </p>

                <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100 max-w-md mx-auto text-left mb-8 space-y-3">
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-500 font-medium">Order Number:</span>
                        <span class="font-mono font-bold text-gray-900 bg-white px-2.5 py-1 rounded-md border border-gray-200">${orderId}</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-500 font-medium">Estimated Delivery:</span>
                        <span class="font-semibold text-emerald-600">${formattedDate}</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-500 font-medium">Total Paid:</span>
                        <span class="font-bold text-gray-900">${totalAmount}</span>
                    </div>
                    <div class="pt-2 border-t border-gray-200 text-xs text-gray-500">
                        Shipping to: <span class="text-gray-700 font-medium">${this.formData.shipping.address}, ${this.formData.shipping.city} ${this.formData.shipping.postalCode}</span>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3 justify-center">
                    <button id="order-success-close-btn" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all duration-200 hover:shadow-md">
                        Continue Shopping
                    </button>
                </div>
            </div>
        `;

        if (window.lucide) {
            window.lucide.createIcons();
        }

        document.getElementById('order-success-close-btn')?.addEventListener('click', () => {
            this.handleCheckoutClose();
            // Reset modal body structure after close animation
            setTimeout(() => {
                this.render();
            }, 300);
        });
    }

    render() {
        const root = document.getElementById('checkout-modal-root');
        if (!root) return;

        root.innerHTML = `
            <div id="checkout-modal" class="fixed inset-0 z-50 overflow-y-auto hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <!-- Backdrop -->
                <div id="checkout-backdrop" class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity opacity-0 duration-300"></div>

                <div class="min-h-screen px-4 text-center flex items-center justify-center sm:p-0">
                    <!-- Modal Panel -->
                    <div id="checkout-panel" class="inline-block w-full max-w-2xl my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl overflow-hidden translate-y-full sm:scale-95 opacity-0 duration-300">
                        
                        <!-- Modal Header -->
                        <div class="px-6 py-5 bg-white border-b border-gray-100 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                    <i data-lucide="shield-check" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <h3 class="text-lg font-bold text-gray-900 tracking-tight" id="modal-title">Secure Checkout</h3>
                                    <p class="text-xs text-gray-500">Encrypted 256-bit SSL Connection</p>
                                </div>
                            </div>
                            <button id="checkout-close-x-btn" class="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>

                        <!-- Stepper Header -->
                        <div class="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between sm:justify-start sm:gap-12">
                            <div id="step-1-indicator" class="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                                <div class="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                                <span>Shipping Address</span>
                            </div>
                            <div class="w-8 h-px bg-gray-300 hidden sm:block"></div>
                            <div id="step-2-indicator" class="flex items-center gap-2 text-gray-400 font-medium text-sm">
                                <div class="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">2</div>
                                <span>Payment Details</span>
                            </div>
                        </div>

                        <!-- Modal Body -->
                        <div id="checkout-modal-body" class="px-6 py-6 max-h-[70vh] overflow-y-auto">
                            
                            <!-- STEP 1: SHIPPING -->
                            <div id="checkout-step-1" class="space-y-4">
                                <h4 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Where should we send your order?</h4>
                                
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                                        <input type="text" id="shipping-firstname" placeholder="Alex" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm outline-none transition-all">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                                        <input type="text" id="shipping-lastname" placeholder="Morgan" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm outline-none transition-all">
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-xs font-medium text-gray-700 mb-1">Email Address (for order receipt) *</label>
                                    <input type="email" id="shipping-email" placeholder="alex.morgan@example.com" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm outline-none transition-all">
                                </div>

                                <div>
                                    <label class="block text-xs font-medium text-gray-700 mb-1">Street Address *</label>
                                    <input type="text" id="shipping-address" placeholder="123 Innovation Way, Suite 400" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm outline-none transition-all">
                                </div>

                                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label class="block text-xs font-medium text-gray-700 mb-1">City *</label>
                                        <input type="text" id="shipping-city" placeholder="San Francisco" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm outline-none transition-all">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-gray-700 mb-1">Postal Code *</label>
                                        <input type="text" id="shipping-postal" placeholder="94107" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm outline-none transition-all">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-gray-700 mb-1">Country</label>
                                        <select id="shipping-country" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm outline-none bg-white transition-all">
                                            <option value="US">United States</option>
                                            <option value="CA">Canada</option>
                                            <option value="UK">United Kingdom</option>
                                            <option value="AU">Australia</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- STEP 2: PAYMENT -->
                            <div id="checkout-step-2" class="space-y-4 hidden">
                                <div class="flex items-center justify-between mb-3">
                                    <h4 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Payment Information</h4>
                                    <div class="flex items-center gap-1.5 text-gray-400">
                                        <i data-lucide="lock" class="w-4 h-4 text-emerald-600"></i>
                                        <span class="text-xs font-medium text-emerald-600">Secure 256-bit Encryption</span>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-xs font-medium text-gray-700 mb-1">Name on Card *</label>
                                    <input type="text" id="payment-name" placeholder="Alex Morgan" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm outline-none transition-all">
                                </div>

                                <div>
                                    <label class="block text-xs font-medium text-gray-700 mb-1">Card Number *</label>
                                    <div class="relative">
                                        <input type="text" id="payment-card" placeholder="4532 •••• •••• 8920" maxlength="19" class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm outline-none transition-all font-mono">
                                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <i data-lucide="credit-card" class="w-4 h-4"></i>
                                        </div>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs font-medium text-gray-700 mb-1">Expiration Date *</label>
                                        <input type="text" id="payment-expiry" placeholder="MM/YY" maxlength="5" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm outline-none transition-all font-mono">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-gray-700 mb-1">CVV Security Code *</label>
                                        <input type="password" id="payment-cvv" placeholder="123" maxlength="4" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm outline-none transition-all font-mono">
                                    </div>
                                </div>

                                <div class="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-start gap-3 mt-4">
                                    <i data-lucide="shield-alert" class="w-5 h-5 text-indigo-600 shrink-0 mt-0.5"></i>
                                    <p class="text-xs text-indigo-900 leading-relaxed">
                                        This is a simulated secure checkout environment. No real funds will be charged to your card. Feel free to use test credentials.
                                    </p>
                                </div>
                            </div>

                        </div>

                        <!-- Modal Footer / Navigation Buttons -->
                        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <button id="checkout-prev-btn" class="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5">
                                <i data-lucide="arrow-left" class="w-4 h-4"></i>
                                <span>Back</span>
                            </button>
                            <div class="flex items-center gap-3">
                                <button id="checkout-cancel-btn" class="px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                                    Cancel
                                </button>
                                <button id="checkout-next-btn" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all duration-200 hover:shadow-md flex items-center gap-2">
                                    <span id="checkout-next-btn-text">Continue to Payment</span>
                                    <i id="checkout-next-icon" data-lucide="arrow-right" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        `;

        this.attachComponentListeners();
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    attachComponentListeners() {
        const closeBtn = document.getElementById('checkout-close-x-btn');
        const cancelBtn = document.getElementById('checkout-cancel-btn');
        const backdrop = document.getElementById('checkout-backdrop');
        const nextBtn = document.getElementById('checkout-next-btn');
        const prevBtn = document.getElementById('checkout-prev-btn');

        if (closeBtn) closeBtn.addEventListener('click', () => this.handleCheckoutClose());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.handleCheckoutClose());
        if (backdrop) backdrop.addEventListener('click', () => {
            if (!this.isProcessing) this.handleCheckoutClose();
        });

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevStep());
        }

        // Format card input auto-spacing
        const cardInput = document.getElementById('payment-card');
        if (cardInput) {
            cardInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.substring(0, 16);
                let formatted = '';
                for (let i = 0; i < value.length; i++) {
                    if (i > 0 && i % 4 === 0) formatted += ' ';
                    formatted += value[i];
                }
                e.target.value = formatted;
            });
        }

        // Format expiry input auto-slash
        const expiryInput = document.getElementById('payment-expiry');
        if (expiryInput) {
            expiryInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.substring(0, 4);
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2);
                }
                e.target.value = value;
            });
        }
    }
}

// Initialize and export global instance
window.checkoutManager = new CheckoutManager();

// Auto-init on DOMContentLoaded if ready, else wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.checkoutManager.init();
    });
} else {
    window.checkoutManager.init();
}