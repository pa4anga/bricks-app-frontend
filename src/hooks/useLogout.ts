import Router from 'next/router';
import { useSWRConfig } from 'swr';

import { getGetAccountsMeKey, usePostAccountsLogout } from '@/api/endpoints/accounts/accounts';
import { INTERNAL_LOGIN_ROUTE } from '@/constants/routes';

export const useLogout = () => {
  const { mutate } = useSWRConfig();
  const { trigger, isMutating } = usePostAccountsLogout();

  const logout = async () => {
    await trigger().catch(() => undefined);
    await mutate(getGetAccountsMeKey(), undefined, { revalidate: false });
    await Router.push(INTERNAL_LOGIN_ROUTE);
  };

  return { logout, isLoggingOut: isMutating };
};
