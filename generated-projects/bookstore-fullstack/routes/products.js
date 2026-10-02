const express = require('express');
const router = express.Router();

// Mock database for books
const products = [
    {
        id: "1",
        title: "The Pragmatic Programmer",
        author: "Andrew Hunt and David Thomas",
        price: 49.99,
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "2",
        title: "Clean Code",
        author: "Robert C. Martin",
        price: 42.50,
        image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "3",
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        price: 55.00,
        image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "4",
        title: "You Don't Know JS Yet",
        author: "Kyle Simpson",
        price: 29.99,
        image: "https://images.unsplash.com/photo-1524578271613-d550eacf6090?auto=format&fit=crop&w=600&q=80"
    }
];

// GET /api/products
router.get('/', (req, res) => {
    try {
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;