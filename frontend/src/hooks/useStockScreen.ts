import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Sector, BulkScreenResult } from '../types';
import type { BulkScreenStats } from '../services/api';

export const useStockScreen = (ticker: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['stock-screen', ticker],
    queryFn: () => api.screenStock(ticker),
    enabled: enabled && ticker.length > 0,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useBulkScreen = (sector: Sector, enabled: boolean = false) => {
  return useQuery<{ results: BulkScreenResult[]; stats: BulkScreenStats }>({
    queryKey: ['bulk-screen', sector],
    queryFn: () => api.bulkScreen(sector),
    enabled,
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
