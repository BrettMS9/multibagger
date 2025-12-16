import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { API_CONFIG } from './config/constants';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging middleware (development)
  if (process.env.NODE_ENV !== 'production') {
    app.use((req: Request, res: Response, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
      });
      next();
    });
  }

  // API routes
  app.use('/api', routes);

  // Root endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      service: 'Multibagger Stock Screener API',
      version: '1.0.0',
      description: 'Yartseva 9-factor scoring system for identifying multibagger stocks',
      endpoints: {
        health: 'GET /api/health',
        methodology: 'GET /api/scoring/methodology',
        score: 'POST /api/scoring/score',
        batch: 'POST /api/scoring/batch',
        filter: 'POST /api/scoring/filter',
        test: 'GET /api/scoring/test'
      },
      documentation: 'https://github.com/yourusername/multibaggers',
      timestamp: new Date().toISOString()
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
export function startServer(): void {
  const app = createApp();
  const port = API_CONFIG.PORT;

  const server = app.listen(port, () => {
    console.log('');
    console.log('========================================');
    console.log('  Multibagger Stock Screener API');
    console.log('  Yartseva 9-Factor Scoring System');
    console.log('========================================');
    console.log('');
    console.log(`Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
    console.log(`Test endpoint: http://localhost:${port}/api/scoring/test`);
    console.log('');
    console.log('Available endpoints:');
    console.log(`  GET  /api/health               - Health check`);
    console.log(`  GET  /api/scoring/methodology  - Scoring explanation`);
    console.log(`  POST /api/scoring/score        - Score single stock`);
    console.log(`  POST /api/scoring/batch        - Score multiple stocks`);
    console.log(`  POST /api/scoring/filter       - Filter by classification`);
    console.log(`  GET  /api/scoring/test         - Test with sample data`);
    console.log('');
    console.log('========================================');
    console.log('');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('\nSIGINT signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}
