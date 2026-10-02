const express = require('express');
   const router = express.Router();

   // In-memory product data (simulating a database)
   const products = [
     { id: 1, name: 'Wireless Headphones', price: 59.99, image: '/images/headphones.jpg' },
     { id: 2, name: 'Mechanical Keyboard', price: 89.99, image: '/images/keyboard.jpg' },
     { id: 3, name: 'USB-C Hub', price: 34.99, image: '/images/usbhub.jpg' },
     { id: 4, name: 'Ergonomic Mouse', price: 45.00, image: '/images/mouse.jpg' },
     { id: 5, name: 'Monitor Stand', price: 29.99, image: '/images/stand.jpg' }
   ];

   // GET /api/products
   router.get('/', (req, res) => {
     try {
       // Optional: support filtering/pagination if needed, but contract says none
       const data = products.map(p => ({
         id: p.id,
         name: p.name,
         price: p.price,
         image: p.image
       }));

       res.status(200).json({
         success: true,
         data: data
       });
     } catch (error) {
       console.error('Error fetching products:', error);
       res.status(500).json({
         success: false,
         message: 'Internal server error while fetching products'
       });
     }
   });

   module.exports = router;