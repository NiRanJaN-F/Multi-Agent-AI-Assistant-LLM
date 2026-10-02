const express = require('express');
const router = express.Router();

// In-memory data store for transactions (shared or isolated per router)
// To keep data consistent across routes if needed, we can export/import, 
// but here we maintain the array for the /api/transactions endpoints.
let transactions = [
    { id: "1", title: "Groceries", amount: 50.00, "type": "expense", date: "2023-10-01" },
    { id: "2", title: "Salary", amount: 2000.00, "type": "income", date: "2023-10-02" }
];

// GET /api/transactions
router.get('/', (req, res) => {
    try {
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/transactions
router.post('/', (req, res) => {
    try {
        const { title, amount, type, date } = req.body;

        if (!title || typeof title !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid or missing title' });
        }
        
        const parsedAmount = Number(amount);
        if (amount === undefined || isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid or missing amount' });
        }
        
        if (!type || !['income', 'expense'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Type must be either "income" or "expense"' });
        }

        const newTransaction = {
            id: Date.now().toString(),
            title: title.trim(),
            amount: parsedAmount,
            type,
            date: date || new Date().toISOString().split('T')[0]
        };

        transactions.push(newTransaction);

        res.status(201).json({
            success: true,
            transaction: newTransaction
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/transactions/:id
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const index = transactions.findIndex(t => t.id === id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        transactions.splice(index, 1);

        res.status(200).json({
            success: true,
            id: id
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;