const express = require('express');
const router = express.Router();

// In-memory savings database reference (shared with routes/savings.js logically via global or persistent store, 
// here mocked or synchronized assuming shared state or simple mock for checkout processing)
// To keep it fully functional and consistent within the scope of this file:
const { savingsGoals } = require('./savings'); 

// POST /api/checkout - Simulate a checkout/contribution to a savings goal
router.post('/', (req, res) => {
    try {
        const { goalId, amount, paymentMethod } = req.body;

        // Validation
        if (!goalId) {
            return res.status(400).json({ success: false, error: 'Goal ID is required' });
        }
        
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ success: false, error: 'A valid positive amount is required' });
        }

        if (!paymentMethod) {
            return res.status(400).json({ success: false, error: 'Payment method is required' });
        }

        // Find the savings goal
        // Note: If savingsGoals is exported from savings.js, we update it directly.
        let goal = null;
        if (typeof savingsGoals !== 'undefined' && Array.isArray(savingsGoals)) {
            goal = savingsGoals.find(g => g.id === goalId);
        }

        if (!goal) {
            // Fallback mock object if array isn't directly mutable or found, 
            // but normally it references the shared array. Let's handle gracefully:
            return res.status(404).json({ success: false, error: 'Savings goal not found' });
        }

        // Update the current amount towards the goal
        goal.current += parsedAmount;

        return res.status(200).json({
            success: true,
            message: 'Checkout simulation successful',
            newBalance: goal.current
        });

    } catch (error) {
        console.error('Checkout error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error during checkout' });
    }
});

module.exports = router;