import { fetchPurchases } from './client';

export const swrConfig = {
  fetcher: (args) => fetchPurchases(args),
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  refreshInterval: 600000,
  dedupingInterval: 2000,
  mutate: {
    rollbackOnError: true,
    populateCache: true,
    revalidate: false,
  },
};