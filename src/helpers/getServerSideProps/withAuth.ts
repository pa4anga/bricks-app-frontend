import type { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import type { UsernameResponse } from '@/api/model';
import { INTERNAL_LOGIN_ROUTE } from '@/constants/routes';

import { withApi } from './withApi';

type LoginRedirectTarget = string | ((context: GetServerSidePropsContext) => string);

interface IAuthenticatedApiContext {
  baseUrl: string;
  username: string;
}

type AuthenticatedHandler<P extends Record<string, unknown>> = (
  context: GetServerSidePropsContext,
  api: IAuthenticatedApiContext
) => Promise<GetServerSidePropsResult<P>> | GetServerSidePropsResult<P>;

export function withAuth(returnTo: LoginRedirectTarget): GetServerSideProps<Record<string, never>>;
export function withAuth<P extends Record<string, unknown>>(
  returnTo: LoginRedirectTarget,
  handler: AuthenticatedHandler<P>
): GetServerSideProps<P>;
export function withAuth<P extends Record<string, unknown>>(
  returnTo: LoginRedirectTarget,
  handler?: AuthenticatedHandler<P>
): GetServerSideProps<P> {
  return withApi<P>(async (context, { baseUrl }) => {
    const cookie = context.req.headers.cookie ?? '';
    const response = await fetch(`${baseUrl}/accounts/me`, {
      headers: { cookie, 'x-forwarded-proto': 'https' },
    });

    if (response.status === 401) {
      const forwardedCookies = cookie
        .split(';')
        .map(part => part.trim().split('=')[0])
        .filter(Boolean);
      console.warn(
        `[ssr-auth] 401 from ${baseUrl}/accounts/me for ${context.resolvedUrl}; forwarded cookies: [${forwardedCookies.join(', ') || 'none'}]`
      );

      const destination = typeof returnTo === 'function' ? returnTo(context) : returnTo;

      return {
        redirect: {
          destination: `${INTERNAL_LOGIN_ROUTE}?redirect=${encodeURIComponent(destination)}`,
          permanent: false,
        },
      };
    }

    if (!response.ok) {
      throw new Error(`Failed to load account (${response.status})`);
    }

    const { username } = (await response.json()) as UsernameResponse;

    return handler ? handler(context, { baseUrl, username }) : { props: {} as P };
  });
}
