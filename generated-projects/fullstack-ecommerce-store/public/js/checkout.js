/**
 * public/js/checkout.js
 * Principal Frontend Architecture - Checkout Flow & Order Processing Module
 * Handles multi-step form validation, real-time calculation, API submission, and success modals.
 */

window.CheckoutModule = (() => {
    // Private State
    let currentStep = 1;
    let orderData = {
        shipping: {},
        payment: {},
        items: [],
        subtotal: 0,
        shippingCost: 0,
        tax: 0,
        total: 0
    };

    // DOM Elements Cache
    let checkoutModal = null;
    let checkoutForm = null;
    let stepIndicators = [];
    let stepContents = [];

    /**
     * Initialize the checkout module and bind UI triggers
     */
    function init() {
        cacheDOM();
        bindEvents();
    }

    function cacheDOM() {
        checkoutModal = document.getElementById('checkout-modal');
        checkoutForm = document.getElementById('checkout-form');
        stepIndicators = document.querySelectorAll('.checkout-step-indicator');
        stepContents = document.querySelectorAll('.checkout-step-content');
    }

    function bindEvents() {
        // Form submission / Next Step interception
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', handleFormSubmit);
        }

        // Format credit card inputs in real-time
        const cardNumberInput = document.getElementById('card-number');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', formatCreditCardInput);
        }

        const cardExpiryInput = document.getElementById('card-expiry');
        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('input', formatExpiryInput);
        }

        const cardCvcInput = document.getElementById('card-cvc');
        if (cardCvcInput) {
            cardCvcInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
            });
        }
    }

    /**
     * Open the checkout modal and calculate initial totals from cart state
     */
    function openCheckout() {
        if (!window.CartModule) {
            console.error('CartModule is required for checkout.');
            return;
        }

        const cart = window.CartModule.getCart();
        if (cart.items.length === 0) {
            showToast('Your cart is empty. Add items before checking out.', 'warning');
            return;
        }

        orderData.items = cart.items;
        orderData.subtotal = cart.total;
        orderData.shippingCost = orderData.subtotal > 50 ? 0 : 5.99;
        orderData.tax = +(orderData.subtotal * 0.08).toFixed(2);
        orderData.total = +(orderData.subtotal + orderData.shippingCost + orderData.tax).toFixed(2);

        renderOrderSummary();
        resetToStep(1);

        if (checkoutModal) {
            checkoutModal.classList.remove('hidden');
            checkoutModal.classList.add('flex');
            setTimeout(() => {
                checkoutModal.querySelector('.modal-card')?.classList.remove('scale-95', 'opacity-0');
                checkoutModal.querySelector('.modal-card')?.classList.add('scale-100', 'opacity-100');
            }, 10);
        }
        
        if (window.lucide) lucide.createIcons();
    }

    /**
     * Close the checkout modal with animation
     */
    function closeCheckout() {
        if (!checkoutModal) return;

        const modalCard = checkoutModal.querySelector('.modal-card');
        if (modalCard) {
            modalCard.classList.remove('scale-100', 'opacity-100');
            modalCard.classList.add('scale-95', 'opacity-0');
        }

        setTimeout(() => {
            checkoutModal.classList.remove('flex');
            checkoutModal.classList.add('hidden');
            if (checkoutForm) checkoutForm.reset();
        }, 200);
    }

    /**
     * Render order summary inside the checkout sidebar/drawer
     */
    function renderOrderSummary() {
        const summaryContainer = document.getElementById('checkout-order-summary');
        if (!summaryContainer) return;

        summaryContainer.innerHTML = `
            <div class="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                ${orderData.items.map(item => `
                    <div class="flex items-center justify-between text-sm">
                        <div class="flex items-center space-x-3">
                            <img src="${item.image}" alt="${item.name}" class="w-12 h-12 object-cover rounded-lg border border-slate-200">
                            <div>
                                <h4 class="font-medium text-slate-800 line-clamp-1">${item.name}</h4>
                                <p class="text-xs text-slate-500">Qty: ${item.quantity}</p>
                            </div>
                        </div>
                        <span class="font-semibold text-slate-700">$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="border-t border-slate-200 mt-4 pt-4 space-y-2 text-sm text-slate-600">
                <div class="flex justify-between">
                    <span>Subtotal</span>
                    <span class="font-medium text-slate-800">$${orderData.subtotal.toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                    <span>Shipping</span>
                    <span class="font-medium text-slate-800">${orderData.shippingCost === 0 ? '<span class="text-emerald-600 font-semibold">FREE</span>' : '$' + orderData.shippingCost.toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                    <span>Estimated Tax (8%)</span>
                    <span class="font-medium text-slate-800">$${orderData.tax.toFixed(2)}</span>
                </div>
                <div class="border-t border-slate-200 pt-3 flex justify-between text-base font-bold text-slate-900">
                    <span>Total</span>
                    <span class="text-indigo-600">$${orderData.total.toFixed(2)}</span>
                </div>
            </div>
        `;
    }

    /**
     * Handle multi-step navigation and final order submission
     */
    function handleFormSubmit(e) {
        e.preventDefault();

        if (currentStep === 1) {
            if (validateStep1()) {
                navigateToStep(2);
            }
        } else if (currentStep === 2) {
            if (validateStep2()) {
                navigateToStep(3);
                // Auto-fill payment summary or ready for final submit
            }
        } else if (currentStep === 3) {
            submitOrder();
        }
    }

    function validateStep1() {
        const firstName = document.getElementById('shipping-firstname')?.value.trim();
        const lastName = document.getElementById('shipping-lastname')?.value.trim();
        const email = document.getElementById('shipping-email')?.value.trim();
        const address = document.getElementById('shipping-address')?.value.trim();
        const city = document.getElementById('shipping-city')?.value.trim();
        const zip = document.getElementById('shipping-zip')?.value.trim();

        if (!firstName || !lastName || !email || !address || !city || !zip) {
            showToast('Please fill in all required shipping fields.', 'error');
            return false;
        }

        // Basic email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Please enter a valid email address.', 'error');
            return false;
        }

        orderData.shipping = { firstName, lastName, email, address, city, zip };
        return true;
    }

    function validateStep2() {
        const shippingMethod = document.querySelector('input[name="shipping-method"]:checked');
        if (!shippingMethod) {
            showToast('Please select a shipping method.', 'error');
            return false;
        }
        return true;
    }

    function navigateToStep(step) {
        currentStep = step;
        
        // Update step contents
        const stepContents = document.querySelectorAll('.checkout-step-content');
        stepContents.forEach(content => {
            const stepNum = parseInt(content.dataset.step);
            if (stepNum === step) {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });

        // Update step indicators
        const indicators = document.querySelectorAll('.checkout-step-indicator');
        indicators.forEach(ind => {
            const indStep = parseInt(ind.dataset.step);
            const circle = ind.querySelector('.step-circle');
            const label = ind.querySelector('.step-label');

            if (indStep === step) {
                circle.className = "step-circle w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm ring-4 ring-indigo-100 transition-all";
                if(label) label.className = "step-label text-xs font-semibold text-indigo-600 mt-1";
            } else if (indStep < step) {
                circle.className = "step-circle w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm transition-all";
                if(label) label.className = "step-label text-xs font-medium text-slate-600 mt-1";
            } else {
                circle.className = "step-circle w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-sm transition-all";
                if(label) label.className = "step-label text-xs font-medium text-slate-400 mt-1";
            }
        });

        // Update submit button text based on step
        const submitBtn = document.getElementById('checkout-next-btn');
        if (submitBtn) {
            if (step === 3) {
                submitBtn.innerHTML = `<span>Complete Order ($${orderData.total.toFixed(2)})</span> <i data-lucide="check-circle" class="w-4 h-4 ml-2"></i>`;
            } else {
                submitBtn.innerHTML = `<span>Continue</span> <i data-lucide="arrow-right" class="w-4 h-4 ml-2"></i>`;
            }
        }

        if (window.lucide) lucide.createIcons();
    }

    function resetToStep(step) {
        navigateToStep(step);
    }

    /**
     * Submit order to POST /api/orders
     */
    async function submitOrder() {
        const cardNumber = document.getElementById('card-number')?.value.trim();
        const cardExpiry = document.getElementById('card-expiry')?.value.trim();
        const cardCvc = document.getElementById('card-cvc')?.value.trim();

        if (!cardNumber || !cardExpiry || !cardCvc) {
            showToast('Please enter valid payment information.', 'error');
            return;
        }

        orderData.payment = {
            cardLast4: cardNumber.slice(-4),
            expiry: cardExpiry
        };

        const submitBtn = document.getElementById('checkout-next-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 mr-2 animate-spin"></i> Processing Securely...`;
            if (window.lucide) lucide.createIcons();
        }

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showOrderSuccessModal(result.orderId || 'ORD-' + Math.floor(100000 + Math.random() * 900000));
                if (window.CartModule) {
                    window.CartModule.clearCart();
                }
            } else {
                throw new Error(result.message || 'Order processing failed on the server.');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            showToast(error.message || 'Network error occurred during checkout.', 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span>Complete Order ($${orderData.total.toFixed(2)})</span> <i data-lucide="check-circle" class="w-4 h-4 ml-2"></i>`;
                if (window.lucide) lucide.createIcons();
            }
        }
    }

    /**
     * Show celebration success state after successful API transaction
     */
    function showOrderSuccessModal(orderId) {
        const modalBody = checkoutModal.querySelector('.modal-card-content');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div class="text-center py-8 space-y-4 animate-fade-in">
                <div class="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <i data-lucide="check" class="w-10 h-10 stroke-[3]"></i>
                </div>
                <h3 class="text-2xl font-bold text-slate-900">Order Placed Successfully!</h3>
                <p class="text-slate-600 text-sm max-w-sm mx-auto">
                    Thank you for your purchase. We have received your order and are getting it ready for shipment.
                </p>
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-xs mx-auto text-left space-y-1">
                    <div class="text-xs text-slate-500 uppercase font-semibold">Order Reference</div>
                    <div class="font-mono text-indigo-600 font-bold text-lg">${orderId}</div>
                    <div class="text-xs text-slate-500 pt-1">Confirmation sent to <b>${orderData.shipping.email}</b></div>
                </div>
                <div class="pt-4">
                    <button onclick="window.CheckoutModule.closeCheckoutAndReload()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition shadow-lg shadow-indigo-100">
                        Continue Shopping
                    </button>
                </div>
            </div>
        `;

        if (window.lucide) lucide.createIcons();
    }

    function closeCheckoutAndReload() {
        closeCheckout();
        // Reset modal structure after close animation
        setTimeout(() => {
            window.location.reload();
        }, 300);
    }

    // Input Formatters
    function formatCreditCardInput(e) {
        let value = e.target.value.replace(/\D/g, '').substring(0, 16);
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
    }

    function formatExpiryInput(e) {
        let value = e.target.value.replace(/\D/g, '').substring(0, 4);
        if (value.length >= 3) {
            value = value.substring(0, 2) + '/' + value.substring(2);
        }
        e.target.value = value;
    }

    function showToast(message, type = 'success') {
        if (window.App && typeof window.App.showToast === 'function') {
            window.App.showToast(message, type);
        } else {
            alert(message);
        }
    }

    // Public API
    return {
        init,
        openCheckout,
        closeCheckout,
        closeCheckoutAndReload
    };
})();

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.CheckoutModule.init();
});