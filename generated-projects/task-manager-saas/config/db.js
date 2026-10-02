// config/db.js
// MongoDB connection setup using Mongoose

const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 * Reads the connection string from the MONGO_URI environment variable.
 * Exits the process if the connection fails.
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskmanager';

  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

/**
 * Gracefully close the MongoDB connection on termination signals.
 */
const gracefulShutdown = () => {
  mongoose.connection.close(() => {
    console.log('🛑 MongoDB connection closed due to app termination');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = {
  connectDB,
  mongoose,
};