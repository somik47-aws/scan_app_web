import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Helps Firebase / container hosting run the Node server correctly
  output: 'standalone',
};

export default nextConfig;
