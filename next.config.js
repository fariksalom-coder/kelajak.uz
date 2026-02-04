/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

const withNextIntl = require('next-intl/plugin')();

module.exports = withNextIntl(nextConfig);
