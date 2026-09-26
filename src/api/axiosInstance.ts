import axios from 'axios';
import Router from 'next/router';

import { INTERNAL_LOGIN_ROUTE } from '@/constants/routes';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export const AXIOS_INSTANCE = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const LOGIN_API_PATH = '/login';

const isLoginRequest = (url: string | undefined): boolean => {
  if (!url) {
    return false;
  }

  const path = url.replace(/[?#].*$/, '');

  return path === LOGIN_API_PATH || path.endsWith(LOGIN_API_PATH);
};

export const shouldRedirectToLogin = (
  status: number | undefined,
  requestUrl: string | undefined,
  currentPath: string
): boolean => status === 401 && !isLoginRequest(requestUrl) && currentPath !== INTERNAL_LOGIN_ROUTE;

AXIOS_INSTANCE.interceptors.response.use(
  response => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && typeof window !== 'undefined') {
      if (shouldRedirectToLogin(error.response?.status, error.config?.url, window.location.pathname)) {
        const from = `${window.location.pathname}${window.location.search}`;
        void Router.push(`${INTERNAL_LOGIN_ROUTE}?redirect=${encodeURIComponent(from)}`);
      }
    }

    return Promise.reject(error);
  }
);
