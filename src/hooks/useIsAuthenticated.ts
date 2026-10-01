import { useGetAccountsMe } from '@/api/endpoints/accounts/accounts';

export const useIsAuthenticated = () => {
  const { data, error, isLoading, isValidating } = useGetAccountsMe({
    swr: { revalidateOnMount: true },
  });

  // Report authenticated only on a fresh, settled success: SWR keeps stale `data` on a failed
  // revalidation, so Boolean(data) alone would loop an expired session against the server-side gate.
  const hasSettled = !isValidating;

  return {
    isAuthenticated: hasSettled && Boolean(data) && !error,
    isCheckingSession: isLoading || isValidating,
  };
};
