import { useGetAccountsMe } from '@/api/endpoints/accounts/accounts';

export const useIsAuthenticated = () => {
  const { data, isLoading } = useGetAccountsMe();

  return { isAuthenticated: Boolean(data), isCheckingSession: isLoading };
};
