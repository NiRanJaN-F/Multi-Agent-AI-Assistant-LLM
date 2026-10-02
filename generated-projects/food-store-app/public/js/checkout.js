/**
 * Checkout Module
 * Handles the complete multi-step checkout flow, form validation, 
 * API submission to POST /api/orders, and post-purchase state handling.
 */

class CheckoutManager {
    constructor() {
        this.modal = null;
        this.form = null;
        this.stepElements = {};
        this.currentStep = 1;
        this.formData = {
            shipping: {
                firstName: '',
                lastName: '',
                email: '',
                address: '',
                city: '',
                zipCode: '',
                country: 'United States'
            },
            payment: {
                cardNumber: '',
                expiry: '',
                cvv: '',
                nameOnCard: ''
            }
        };
        this.isSubmitting = false;
        
        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.modal = document.getElementById('checkout-modal');
        if (!this.modal) return;

        this.form = document.getElementById('checkout-form');
        
        // Cache step indicators and panels
        for (let i = 1; i <= 3; i++) {
            this.stepElements[`step${i}`] = document.getElementById(`checkout-step-${i}`);
            this.stepElements[`indicator${i}`] = document.getElementById(`step-indicator-${i}`);
        }

        this.summaryContainer = document.getElementById('checkout-order-summary');
        this.totalContainer = document.getElementById('checkout-total-amount');
        this.successView = document.getElementById('checkout-success-view');
        this.formView = document.getElementById('checkout-form-view');
    }

    bindEvents() {
        if (!this.modal) return;

        // Open/Close triggers managed globally or via cart.js, but we listen for open events
        window.addEventListener('open-checkout', () => this.open());

        // Close triggers
        const closeBtn = document.getElementById('close-checkout-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal && !this.isSubmitting) {
                this.close();
            }
        });

        // Step Navigation Buttons
        const nextToStep2 = document.getElementById('next-to-step-2');
        if (nextToStep2) {
            nextToStep2.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.validateStep(1)) {
                    this.saveStepData(1);
                    this.goToStep(2);
                }
            });
        }

        const backToStep1 = document.getElementById('back-to-step-1');
        if (backToStep1) {
            backToStep1.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToStep(1);
            });
        }

        const nextToStep3 = document.getElementById('next-to-step-3');
        if (nextToStep3) {
            nextToStep3.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.validateStep(2)) {
                    this.saveStepData(2);
                    this.renderReviewStep();
                    this.goToStep(3);
                }
            });
        }

        const backToStep2 = document.getElementById('back-to-step-2');
        if (backToStep2) {
            backToStep2.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToStep(2);
            });
        }

        // Final Form Submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitOrder();
            });
        }

        // Format card inputs dynamically
        const cardInput = document.getElementById('card-number');
        if (cardInput) {
            cardInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.substring(0, 16);
                value = value.replace(/(.{4})/g, '$1 ').trim();
                e.target.value = value;
            });
        }

        const expiryInput = document.getElementById('card-expiry');
        if (expiryInput) {
            expiryInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value;
            });
        }

        const cvvInput = document.getElementById('card-cvv');
        if (cvvInput) {
            cvvInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
            });
        }
    }

    open() {
        if (!this.modal) return;
        this.currentStep = 1;
        this.isSubmitting = false;
        this.goToStep(1);
        
        if (this.successView) this.successView.classList.add('hidden');
        if (this.formView) this.formView.classList.remove('hidden');
        if (this.form) this.form.reset();

        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    close() {
        if (!this.modal) return;
        this.modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    goToStep(stepNumber) {
        this.currentStep = stepNumber;
        
        for (let i = 1; i <= 3; i++) {
            const stepEl = this.stepElements[`step${i}`];
            const indicatorEl = this.stepElements[`indicator${i}`];
            
            if (stepEl) {
                if (i === stepNumber) {
                    stepEl.classList.remove('hidden');
                } else {
                    stepEl.classList.add('hidden');
                }
            }

            if (indicatorEl) {
                if (i === stepNumber) {
                    indicatorEl.classList.add('active', 'border-emerald-600', 'text-emerald-600');
                    indicatorEl.classList.remove('border-gray-300', 'text-gray-400', 'bg-emerald-600', 'text-white');
                } else if (i < stepNumber) {
                    indicatorEl.classList.add('bg-emerald-600', 'border-emerald-600', 'text-white');
                    indicatorEl.classList.remove('active', 'border-gray-300', 'text-gray-400', 'text-emerald-600');
                } else {
                    indicatorEl.classList.add('border-gray-300', 'text-gray-400');
                    indicatorEl.classList.remove('active', 'bg-emerald-600', 'border-emerald-600', 'text-white', 'text-emerald-600');
                }
            }
        }
    }

    validateStep(stepNumber) {
        if (stepNumber === 1) {
            const firstName = document.getElementById('shipping-first-name')?.value.trim();
            const lastName = document.getElementById('shipping-last-name')?.value.trim();
            const email = document.getElementById('shipping-email')?.value.trim();
            const address = document.getElementById('shipping-address')?.value.trim();
            const city = document.getElementById('shipping-city')?.value.trim();
            const zipCode = document.getElementById('shipping-zip')?.value.trim();

            if (!firstName || !lastName || !email || !address || !city || !zipCode) {
                alert('Please fill in all required shipping fields.');
                return false;
            }
            if (!email.includes('@') || !email.includes('.')) {
                alert('Please enter a valid email address.');
                return false;
            }
            return true;
        }

        if (stepNumber === 2) {
            const cardNumber = document.getElementById('card-number')?.value.trim();
            const expiry = document.getElementById('card-expiry')?.value.trim();
            const cvv = document.getElementById('card-cvv')?.value.trim();
            const nameOnCard = document.getElementById('card-name')?.value.trim();

            if (!cardNumber || !expiry || !cvv || !nameOnCard) {
                alert('Please fill in all payment details.');
                return false;
            }
            if (cardNumber.replace(/\s/g, '').length < 15) {
                alert('Please enter a valid card number.');
                return false;
            }
            return true;
        }

        return true;
    }

    saveStepData(stepNumber) {
        if (stepNumber === 1) {
            this.formData.shipping = {
                firstName: document.getElementById('shipping-first-name')?.value.trim(),
                lastName: document.getElementById('shipping-last-name')?.value.trim(),
                email: document.getElementById('shipping-email')?.value.trim(),
                address: document.getElementById('shipping-address')?.value.trim(),
                city: document.getElementById('shipping-city')?.value.trim(),
                zipCode: document.getElementById('shipping-zip')?.value.trim(),
                country: document.getElementById('shipping-country')?.value || 'United States'
            };
        } else if (stepNumber === 2) {
            this.formData.payment = {
                cardNumber: document.getElementById('card-number')?.value.trim(),
                expiry: document.getElementById('card-expiry')?.value.trim(),
                cvv: document.getElementById('card-cvv')?.value.trim(),
                nameOnCard: document.getElementById('card-name')?.value.trim()
            };
        }
    }

    renderReviewStep() {
        if (!this.summaryContainer || !window.cartManager) return;

        const items = window.cartManager.getItems();
        let html = '';

        if (items.length === 0) {
            html = '<p class="text-gray-500 text-sm">Your cart is empty.</p>';
        } else {
            html = '<ul class="divide-y divide-gray-200 max-h-60 overflow-y-auto pr-2">';
            items.forEach(item => {
                html += `
                    py-3 flex justify-between items-center text-sm">
                        <div class="flex items-center space-x-3">
                            <span class="font-medium text-gray-800">${item.name}</span>
                            <span class="text-gray-500">x${item.quantity}</span>
                        </div>
                        <span class="font-semibold text-gray-900">$${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                `;
            });
            html += '</ul>';
        }

        this.summaryContainer.innerHTML = html;

        if (this.totalContainer && window.cartManager) {
            this.totalContainer.textContent = `$${window.cartManager.getTotal().toFixed(2)}`;
        }
    }

    async submitOrder() {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        const submitBtn = document.getElementById('complete-order-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing Order...';
        }

        try {
            const orderPayload = {
                shipping: this.formData.shipping,
                payment: {
                    nameOnCard: this.formData.payment.nameOnCard,
                    cardNumber: '****-****-****-' + this.formData.payment.cardNumber.slice(-4),
                    expiry: this.formData.payment.expiry
                },
                items: window.cartManager ? window.cartManager.getItems() : [],
                total: window.cartManager ? window.cartManager.getTotal() : 0
            };

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderPayload)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit order');
            }

            // Success handling
            if (window.cartManager) {
                window.cartManager.clearCart();
            }

            if (this.formView) this.formView.classList.add('hidden');
            if (this.successView) this.successView.classList.remove('hidden');

            const orderIdEl = document.getElementById('checkout-order-id');
            if (orderIdEl && result.orderId) {
                orderIdEl.textContent = result.orderId;
            }

        } catch (error) {
            console.error('Checkout error:', error);
            alert(`Error processing your order: ${error.message}`);
        } finally {
            this.isSubmitting = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Complete Order';
            }
        }
    }
}

// Initialize global checkout manager
document.addEventListener('DOMContentLoaded', () => {
    window.checkoutManager = new CheckoutManager();
});