import { QueryClient } from '@tanstack/react-query';
export const queryClient = new QueryClient({ defaultOptions:{ queries:{retry:1,staleTime:60_000,refetchOnWindowFocus:false} } });

/** Account-owned query data and pending responses must not survive an account change. */
export function clearAccountQueryCache() {
  // Cancellation aborts current query signals synchronously before their cache entries are removed.
  void queryClient.cancelQueries();
  queryClient.clear();
}
