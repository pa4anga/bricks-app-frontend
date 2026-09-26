import type { GetServerSidePropsResult } from 'next';

export const redirect500: GetServerSidePropsResult<never> = {
  redirect: { destination: '/500', permanent: false },
};

export const redirect404: GetServerSidePropsResult<never> = {
  notFound: true,
};

export const redirect403: GetServerSidePropsResult<never> = {
  redirect: { destination: '/403', permanent: false },
};
