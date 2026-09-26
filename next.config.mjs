import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDevMode = (process.env.APP_ENV ?? process.env.NODE_ENV) !== 'production';

const devAllowedOrigins = (process.env.DEV_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow SCSS modules to `@use 'variables' as *;` without deep relative paths.
  sassOptions: {
    includePaths: [path.join(__dirname, 'src/styles')],
  },
  ...(isDevMode && devAllowedOrigins.length > 0 ? { allowedDevOrigins: devAllowedOrigins } : {}),
};

export default nextConfig;
