import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.6'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'the-ants-api.thawyezaw.workers.dev',
      },
      {
        protocol: 'https',
        hostname: '**.workers.dev',
      },
      {
        protocol: 'https',
        hostname: 'api.the-ants.org',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8787',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8787',
      },
    ],
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ],
};

export default nextConfig;
