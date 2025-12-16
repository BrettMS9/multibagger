import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Exchange } from '../types';

export const useStockScreen = (ticker: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['stock-screen', ticker],
    queryFn: () => api.screenStock(ticker),
    enabled: enabled && ticker.length > 0,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useBulkScreen = (exchange: Exchange, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['bulk-screen', exchange],
    queryFn: () => api.bulkScreen(exchange),
    enabled,
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
