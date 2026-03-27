/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration for troubleshooting
  experimental: {
    // Temporarily disable experimental features
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
