const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: '/offline.html',
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone output is only needed for Docker builds (Linux).
  // On Windows, Next.js standalone traces pnpm symlinks which requires
  // Developer Mode. Skip it locally; Docker sets NEXT_STANDALONE=true.
  output: process.env.NEXT_STANDALONE === 'true' ? 'standalone' : undefined,
  experimental: { serverActions: { allowedOrigins: ['localhost:3000'] } },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    };
    return config;
  },
};

module.exports = withPWA(nextConfig);
