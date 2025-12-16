import { Router } from 'express';
import { screenController } from '../controllers/screen.controller';

const router = Router();

// Screen a single ticker
router.get('/ticker/:ticker', (req, res) => screenController.screenTicker(req, res));

// Get top scoring stocks
router.get('/top', (req, res) => screenController.getTopScorers(req, res));

// Get historical screening results for a ticker
router.get('/history/:ticker', (req, res) => screenController.getTickerHistory(req, res));

export default router;
