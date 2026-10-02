import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the frontend public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);

// Checkout Endpoint fulfilling the API contract
app.post('/api/checkout', (req, res) => {
    try {
        const { items, customer } = req.body;

        // Basic validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Cart is empty or invalid.' });
        }

        if (!customer || !customer.name || !customer.address) {
            return res.status(400).json({ success: false, error: 'Customer name and address are required.' });
        }

        // Mock product pricing database to calculate total securely on the backend
        const mockCatalog = {
            1: { name: "Wireless Headphones", price: 99.99 },
            2: { name: "Mechanical Keyboard", price: 79.99 },
            3: { name: "Ergonomic Mouse", price: 49.99 },
            4: { name: "USB-C Hub", price: 29.99 },
            5: { name: "Ultra-Wide Monitor", price: 399.99 },
            6: { name: "Desk Mat", price: 19.99 }
        };

        let calculatedTotal = 0;

        for (const item of items) {
            const product = mockCatalog[item.id];
            const quantity = parseInt(item.quantity, 10);

            if (!product) {
                return res.status(400).json({ success: false, error: `Invalid product ID: ${item.id}` });
            }

            if (isNaN(quantity) || quantity <= 0) {
                return res.status(400).json({ success: false, error: `Invalid quantity for product ID: ${item.id}` });
            }

            calculatedTotal += product.price * quantity;
        }

        // Generate mock order ID and formatted total
        const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
        const total = parseFloat(calculatedTotal.toFixed(2));

        return res.status(200).json({
            success: true,
            orderId,
            total
        });

    } catch (err) {
        console.error('Checkout error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error during checkout.' });
    }
});

// Fallback to index.html for SPA routing if needed
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled application error:', err.stack);
    res.status(500).json({ success: false, error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});