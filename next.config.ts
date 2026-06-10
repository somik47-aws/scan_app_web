import type { NextConfig } from 'next';

const CORS_SCAN_HEADERS = [
  { key: 'Access-Control-Allow-Origin', value: '*' },
  { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
  { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
];

const nextConfig: NextConfig = {
  // Helps Firebase / container hosting run the Node server correctly
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/api/scan',
        headers: CORS_SCAN_HEADERS,
      },
    ];
  },
};

export default nextConfig;
