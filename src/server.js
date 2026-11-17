require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to database on server start
connectDB()
  .then(() => {
    // Only listen when running directly (standalone mode)
    if (process.env.NODE_ENV !== 'test') {
      const server = app.listen(PORT, () => {
        console.log(`[Server] Doctor Tracker API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      });

      // Handle unhandled promise rejections
      process.on('unhandledRejection', (err) => {
        console.error(`Unhandled Rejection Error: ${err.message}`);
        // Keep server running in development or log error
      });
    }
  })
  .catch((err) => {
    console.error(`Failed to connect to MongoDB on startup: ${err.message}`);
    // Start listening anyway so healthcheck/error responses can inform the client
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        console.log(`[Server] Doctor Tracker API running on port ${PORT} (Database pending connection)`);
      });
    }
  });

module.exports = app;
