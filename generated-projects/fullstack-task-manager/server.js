const express = require('express');
   const path = require('path');
   const cors = require('cors');
   const apiRoutes = require('./routes/api');

   const app = express();
   const PORT = process.env.PORT || 3000;

   // Middleware
   app.use(cors());
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));

   // Serve static frontend files
   app.use(express.static(path.join(__dirname, 'public')));

   // API Routes
   app.use('/api', apiRoutes);

   // Global Error Handler
   app.use((err, req, res, next) => {
     console.error(err.stack);
     res.status(err.status || 500).json({
       success: false,
       message: err.message || 'Internal Server Error',
       error: process.env.NODE_ENV === 'development' ? err : {}
     });
   });

   // Handle 404
   app.use((req, res) => {
     res.status(404).json({ success: false, message: 'Route not found' });
   });

   // Start Server
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });

   module.exports = app;