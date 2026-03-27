/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Basic configuration for troubleshooting
  experimental: {
    // Temporarily disable experimental features
  },

  eslint: {
    // Warning: This allows production builds to successfully complete 
    // even if your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete 
    // even if your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  
  images: {
    domains: ['localhost'],
  },
  
  // Simplified webpack config
  webpack: (config, { dev }) => {
    return config;
  },
  
  // Basic headers
  async headers() {
    return [];
  },
  
  // Basic redirects
  async redirects() {
    return [];
  },
};

module.exports = nextConfig;
