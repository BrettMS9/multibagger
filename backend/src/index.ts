import express from 'express';
import dotenv from 'dotenv';
import screenRoutes from './routes/screen.routes';
import cacheRoutes from './routes/cache.routes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/screen', screenRoutes);
app.use('/api/cache', cacheRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'Multibagger Stock Screener API',
    version: '1.0.0',
    description: 'Backend API for screening stocks using Yartseva methodology',
    endpoints: {
      health: '/health',
      screenTicker: '/api/screen/ticker/:ticker',
      topScorers: '/api/screen/top?limit=50&minScore=25',
      tickerHistory: '/api/screen/history/:ticker',
      cacheStats: '/api/cache/stats',
      clearExpiredCache: 'DELETE /api/cache/expired',
      clearAllCache: 'DELETE /api/cache/all'
    }
  });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('Multibagger Stock Screener API');
  console.log('Based on Yartseva (2025) Methodology');
  console.log('');
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  - GET  /health');
  console.log('  - GET  /api/screen/ticker/:ticker');
  console.log('  - GET  /api/screen/top');
  console.log('  - GET  /api/screen/history/:ticker');
  console.log('  - GET  /api/cache/stats');
  console.log('  - DEL  /api/cache/expired');
  console.log('  - DEL  /api/cache/all');
  console.log('');
  console.log('API Keys configured:');
  console.log(`  - FMP_API_KEY: ${process.env.FMP_API_KEY ? 'configured' : 'MISSING (required)'}`);
  console.log(`  - GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'configured' : 'not set (optional fallback)'}`);
});

export default app;
