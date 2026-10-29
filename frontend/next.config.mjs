import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep development and demo builds away from an existing or damaged .next cache.
  distDir: process.env.VALAM_FRONTEND_DIST || (process.env.NODE_ENV === 'development'
    ? '.next-dev'
    : process.env.PERTAMUDA_FRONTEND_BUILD === 'true' ? '.next-pertamuda' : '.next'),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          }
        ]
      }
    ];
  },
};

export default withNextIntl(nextConfig);
