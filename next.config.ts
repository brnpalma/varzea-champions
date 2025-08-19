
import type {NextConfig} from 'next';
import type { PWAConfig } from 'next-pwa';

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  // runtimeCaching is not needed, as the default behavior already matches the requirements.
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: '/_next/static/favicon.ico',
        permanent: true,
      },
    ];
  },
};

export default withPWA(nextConfig);
