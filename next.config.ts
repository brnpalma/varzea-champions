
import type { NextConfig } from 'next';

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
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
      },
    ],
    // Forçar a recarga de imagens estáticas no modo de desenvolvimento
    unoptimized: process.env.NODE_ENV === 'development',
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
