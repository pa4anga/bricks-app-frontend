import type { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { redirect500 } from '@/helpers/redirect';

export interface IApiContext {
  baseUrl: string;
}

type Handler<P extends Record<string, unknown>> = (
  context: GetServerSidePropsContext,
  api: IApiContext
) => Promise<GetServerSidePropsResult<P>>;

export const withApi =
  <P extends Record<string, unknown>>(handler: Handler<P>): GetServerSideProps<P> =>
  async context => {
    try {
      return await handler(context, { baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? '' });
    } catch {
      return redirect500;
    }
  };
