/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['framer-motion', 'next-intl'],
  },
};

const withNextIntl = require('next-intl/plugin')();

module.exports = withNextIntl(nextConfig);
