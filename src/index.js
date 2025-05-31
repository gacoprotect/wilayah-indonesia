import express from 'express';
import wilayahRoutes from './routes/wilayahRoutes.js';
import errorHandler from './middlewares/errorHandler.js';
import { setupCache } from './utils/cache.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use('/static', express.static('static'));


// Cache setup
if (process.env.ENABLE_CACHE === 'true') {
  setupCache(app);
}

// Routes
app.use('/api', wilayahRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    requestedUrl: req.originalUrl
  });
});

// Error Handler
app.use(errorHandler);

// Server startup
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Cache: ${process.env.ENABLE_CACHE === 'true' ? 'Aktif' : 'Nonaktif'}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

export default app;