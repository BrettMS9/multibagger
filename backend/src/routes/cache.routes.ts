import { Router } from 'express';
import { cacheService } from '../services/cache.service';

const router = Router();

// Get cache statistics
router.get('/stats', (_req, res) => {
  try {
    const stats = cacheService.getCacheStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

// Clear expired cache entries
router.delete('/expired', (_req, res) => {
  try {
    const deleted = cacheService.clearExpiredCache();
    res.json({ deleted, message: `Cleared ${deleted} expired entries` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear expired cache' });
  }
});

// Clear all cache entries
router.delete('/all', (_req, res) => {
  try {
    const deleted = cacheService.clearAllCache();
    res.json({ deleted, message: `Cleared ${deleted} entries` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

export default router;
