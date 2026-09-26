import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppCacheProvider } from '@mui/material-nextjs/v15-pagesRouter';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { SWRConfig } from 'swr';

import { AnalyticsProvider } from '@/analytics';
import { CookieConsentBanner, shouldShowCookieBanner } from '@/components/consent';
import { theme } from '@/theme/theme';

import '@/styles/globals.scss';

export default function App(props: AppProps) {
  const { Component, pageProps } = props;
  const router = useRouter();

  return (
    <AppCacheProvider {...props}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SWRConfig value={{ revalidateOnFocus: false, shouldRetryOnError: false }}>
          <Component {...pageProps} />
          <AnalyticsProvider />
          {shouldShowCookieBanner(router.pathname) && <CookieConsentBanner />}
        </SWRConfig>
      </ThemeProvider>
    </AppCacheProvider>
  );
}
