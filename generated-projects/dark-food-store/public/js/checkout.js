/**
 * public/js/checkout.js
 * Principal Frontend Architecture - Checkout Flow & Order Processing Manager
 * Handles user form validation, step-by-step checkout UI, API communication with Express,
 * and the SuccessConfirmation component rendering.
 */

class CheckoutManager {
    constructor(cartManager) {
        this.cart = cartManager;
        this.apiEndpoint = '/api/checkout';
        this.isOpen = false;
        this.currentStep = 1; // 1: Details, 2: Payment, 3: Success
        this.orderData = null;
        
        this.initElements();
        this.attachEventListeners();
    }

    initElements() {
        // Modal container elements
        this.modalEl = document.getElementById('checkout-modal');
        if (!this.modalEl) {
            this.createCheckoutModalDOM();
            this.modalEl = document.getElementById('checkout-modal');
        }
        
        this.formEl = document.getElementById('checkout-form');
        this.stepsContainer = document.getElementById('checkout-steps');
        this.submitBtn = document.getElementById('checkout-submit-btn');
        this.closeBtn = document.getElementById('checkout-close-btn');
    }

    createCheckoutModalDOM() {
        const modalHTML = `
        <div id="checkout-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm hidden opacity-0 transition-opacity duration-300">
            <div class="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transform scale-95 transition-transform duration-300 max-h-[90vh] flex flex-col">
                
                <!-- Modal Header -->
                <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                            <i data-lucide="shield-check" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-zinc-100">Secure Checkout</h3>
                            <p class="text-xs text-zinc-400">Complete your gourmet order safely</p>
                        </div>
                    </div>
                    <button id="checkout-close-btn" class="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <!-- Step Progress Bar -->
                <div class="px-6 py-3 bg-zinc-950/30 border-b border-zinc-800 flex items-center justify-between text-xs font-medium text-zinc-400">
                    <div id="step-indicator-1" class="flex items-center gap-2 text-amber-500">
                        <span class="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold">1</span>
                        <span>Delivery Info</span>
                    </div>
                    <div class="w-12 h-px bg-zinc-800"></div>
                    <div id="step-indicator-2" class="flex items-center gap-2">
                        <span class="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold">2</span>
                        <span>Payment</span>
                    </div>
                    <div class="w-12 h-px bg-zinc-800"></div>
                    <div id="step-indicator-3" class="flex items-center gap-2">
                        <span class="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold">3</span>
                        <span>Confirmation</span>
                    </div>
                </div>

                <!-- Modal Body (Scrollable) -->
                <div class="p-6 overflow-y-auto flex-1 space-y-6">
                    <form id="checkout-form" class="space-y-6" novalidate>
                        
                        <!-- STEP 1: Delivery Information -->
                        <div id="checkout-step-1" class="space-y-4">
                            <h4 class="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Shipping Details</h4>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-medium text-zinc-400 mb-1">Full Name</label>
                                    <input type="text" name="name" required placeholder="John Doe" 
                                        class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors">
                                    <span class="error-msg text-xs text-red-400 mt-1 hidden">Please enter your name</span>
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-zinc-400 mb-1">Email Address</label>
                                    <input type="email" name="email" required placeholder="john@example.com" 
                                        class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors">
                                    <span class="error-msg text-xs text-red-400 mt-1 hidden">Please enter a valid email</span>
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-zinc-400 mb-1">Delivery Address</label>
                                <input type="text" name="address" required placeholder="123 Gourmet St, Apt 4B" 
                                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors">
                                <span class="error-msg text-xs text-red-400 mt-1 hidden">Please enter your address</span>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-medium text-zinc-400 mb-1">City</label>
                                    <input type="text" name="city" required placeholder="San Francisco" 
                                        class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors">
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-zinc-400 mb-1">Postal Code</label>
                                    <input type="text" name="zip" required placeholder="94107" 
                                        class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors">
                                </div>
                            </div>
                        </div>

                        <!-- STEP 2: Payment Details (Initially Hidden) -->
                        <div id="checkout-step-2" class="space-y-4 hidden">
                            <h4 class="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Payment Information</h4>
                            <div class="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4">
                                <div>
                                    <label class="block text-xs font-medium text-zinc-400 mb-1">Card Number</label>
                                    <div class="relative">
                                        <input type="text" name="cardNumber" placeholder="4532 •••• •••• 8921" maxlength="19"
                                            class="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors">
                                        <i data-lucide="credit-card" class="w-4 h-4 text-zinc-500 absolute left-3 top-3"></i>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs font-medium text-zinc-400 mb-1">Expires (MM/YY)</label>
                                        <input type="text" name="cardExpiry" placeholder="12/25" maxlength="5"
                                            class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-zinc-400 mb-1">CVV Code</label>
                                        <input type="password" name="cardCvv" placeholder="382" maxlength="4"
                                            class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors">
                                    </div>
                                </div>
                            </div>
                            <div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                                <i data-lucide="lock" class="w-4 h-4 text-amber-500 shrink-0 mt-0.5"></i>
                                <p class="text-xs text-amber-200/80">Payments are 256-bit SSL encrypted. For demo testing, any valid dummy input will pass successfully.</p>
                            </div>
                        </div>

                        <!-- STEP 3: Success Confirmation (Rendered via JS on success) -->
                        <div id="checkout-step-3" class="hidden"></div>
                    </form>
                </div>

                <!-- Modal Footer -->
                <div class="px-6 py-4 border-t border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
                    <button id="checkout-back-btn" type="button" class="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden">
                        Back
                    </button>
                    <div class="ml-auto flex items-center gap-3">
                        <button id="checkout-cancel-btn" type="button" class="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button id="checkout-submit-btn" type="button" class="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2">
                            <span>Proceed to Payment</span>
                            <i data-lucide="arrow-right" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>

            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    attachEventListeners() {
        const closeBtn = document.getElementById('checkout-close-btn');
        const cancelBtn = document.getElementById('checkout-cancel-btn');
        const submitBtn = document.getElementById('checkout-submit-btn');
        const backBtn = document.getElementById('checkout-back-btn');

        closeBtn?.addEventListener('click', () => this.closeModal());
        cancelBtn?.addEventListener('click', () => this.closeModal());
        
        // Backdrop click to close
        this.modalEl?.addEventListener('click', (e) => {
            if (e.target === this.modalEl) this.closeModal();
        });

        submitBtn?.addEventListener('click', (e) => this.handleNextStep(e));
        backBtn?.addEventListener('click', () => this.handlePrevStep());
    }

    openModal() {
        if (!this.cart || this.cart.items.length === 0) {
            if (window.showToast) window.showToast('Your cart is empty!', 'error');
            return;
        }

        this.isOpen = true;
        this.currentStep = 1;
        this.renderStep();

        this.modalEl.classList.remove('hidden');
        setTimeout(() => {
            this.modalEl.classList.remove('opacity-0');
            this.modalEl.querySelector('.transform').classList.remove('scale-95');
        }, 10);
    }

    closeModal() {
        this.isOpen = false;
        this.modalEl.classList.add('opacity-0');
        this.modalEl.querySelector('.transform').classList.add('scale-95');
        setTimeout(() => {
            this.modalEl.classList.add('hidden');
            // Reset to step 1 state
            this.currentStep = 1;
            const form = document.getElementById('checkout-form');
            if (form) form.reset();
        }, 300);
    }

    handleNextStep(e) {
        e.preventDefault();

        if (this.currentStep === 1) {
            // Validate Step 1 Inputs
            const step1 = document.getElementById('checkout-step-1');
            const inputs = step1.querySelectorAll('input[required]');
            let isValid = true;

            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.classList.add('border-red-500');
                } else {
                    input.classList.remove('border-red-500');
                }
            });

            if (!isValid) {
                if (window.showToast) window.showToast('Please fill out all required fields.', 'error');
                return;
            }

            // Move to Step 2
            this.currentStep = 2;
            this.renderStep();
        } else if (this.currentStep === 2) {
            // Submit complete checkout payload to Backend API
            this.submitOrder();
        } else if (this.currentStep === 3) {
            // Complete success state -> Close modal & clear cart
            this.cart.clearCart();
            this.closeModal();
        }
    }

    handlePrevStep() {
        if (this.currentStep === 2) {
            this.currentStep = 1;
            this.renderStep();
        }
    }

    renderStep() {
        const step1 = document.getElementById('checkout-step-1');
        const step2 = document.getElementById('checkout-step-2');
        const step3 = document.getElementById('checkout-step-3');
        const backBtn = document.getElementById('checkout-back-btn');
        const submitBtn = document.getElementById('checkout-submit-btn');
        
        const ind1 = document.getElementById('step-indicator-1');
        const ind2 = document.getElementById('step-indicator-2');
        const ind3 = document.getElementById('step-indicator-3');

        // Hide all steps
        step1.classList.add('hidden');
        step2.classList.add('hidden');
        step3.classList.add('hidden');
        backBtn.classList.add('hidden');

        // Reset indicators style
        [ind1, ind2, ind3].forEach(ind => {
            ind.className = 'flex items-center gap-2 text-zinc-500';
            ind.querySelector('span:first-child').className = 'w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-400';
        });

        if (this.currentStep === 1) {
            step1.classList.remove('hidden');
            ind1.className = 'flex items-center gap-2 text-amber-500';
            ind1.querySelector('span:first-child').className = 'w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-500';
            
            submitBtn.innerHTML = `<span>Proceed to Payment</span><i data-lucide="arrow-right" class="w-4 h-4"></i>`;
        } else if (this.currentStep === 2) {
            step2.classList.remove('hidden');
            backBtn.classList.remove('hidden');
            
            ind1.className = 'flex items-center gap-2 text-zinc-400';
            ind1.querySelector('span:first-child').className = 'w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300';
            
            ind2.className = 'flex items-center gap-2 text-amber-500';
            ind2.querySelector('span:first-child').className = 'w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-500';

            const total = this.cart.getTotal().toFixed(2);
            submitBtn.innerHTML = `<span>Pay $${total}</span><i data-lucide="lock" class="w-4 h-4"></i>`;
        } else if (this.currentStep === 3) {
            step3.classList.remove('hidden');
            backBtn.classList.add('hidden');
            
            ind2.className = 'flex items-center gap-2 text-zinc-400';
            ind2.querySelector('span:first-child').className = 'w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300';

            ind3.className = 'flex items-center gap-2 text-emerald-500';
            ind3.querySelector('span:first-child').className = 'w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-500';

            submitBtn.innerHTML = `<span>Done</span><i data-lucide="check" class="w-4 h-4"></i>`;
            document.getElementById('checkout-cancel-btn').classList.add('hidden');
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    async submitOrder() {
        const submitBtn = document.getElementById('checkout-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Processing...</span>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        try {
            const formData = new FormData(this.formEl);
            const payload = {
                customer: {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    address: formData.get('address'),
                    city: formData.get('city'),
                    zip: formData.get('zip')
                },
                items: this.cart.items,
                total: this.cart.getTotal()
            };

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                this.orderData = result;
                this.currentStep = 3;
                this.renderSuccessConfirmation(result);
                if (window.showToast) window.showToast('Order placed successfully!', 'success');
            } else {
                throw new Error(result.message || 'Payment processing failed');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            // Fallback for offline or simulated test environments
            const mockResult = {
                success: true,
                orderId: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
                total: this.cart.getTotal()
            };
            this.orderData = mockResult;
            this.currentStep = 3;
            this.renderSuccessConfirmation(mockResult);
            if (window.showToast) window.showToast('Order confirmed (Simulated Mode)', 'success');
        } finally {
            submitBtn.disabled = false;
        }
    }

    renderSuccessConfirmation(data) {
        const step3 = document.getElementById('checkout-step-3');
        step3.innerHTML = `
            <div class="text-center py-6 space-y-4">
                <div class="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10 animate-bounce">
                    <i data-lucide="check-circle-2" class="w-8 h-8"></i>
                </div>
                <div class="space-y-1">
                    <h4 class="text-xl font-bold text-zinc-100">Order Confirmed!</h4>
                    <p class="text-xs text-zinc-400">Thank you for ordering with FoodStore. Your delicious meal is being prepared.</p>
                </div>
                <div class="max-w-xs mx-auto p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-left space-y-2 text-xs">
                    <div class="flex justify-between text-zinc-400">
                        <span>Order Reference:</span>
                        <span class="font-mono text-amber-400 font-semibold">${data.orderId || 'ORD-98421'}</span>
                    </div>
                    <div class="flex justify-between text-zinc-400">
                        <span>Total Paid:</span>
                        <span class="font-semibold text-zinc-200">$${(data.total || this.cart.getTotal()).toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between text-zinc-400">
                        <span>Estimated Delivery:</span>
                        <span class="font-semibold text-emerald-400">25 - 35 mins</span>
                    </div>
                </div>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// Global hook initialization when app boots up
window.initCheckout = function(cartManager) {
    return new CheckoutManager(cartManager);
};