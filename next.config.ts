import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow S3-hosted assets (e.g., realtor headshots)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'photos4remedia.s3.ca-central-1.amazonaws.com',
      },
      // Generic S3 patterns (optional, helps if buckets/regions vary)
      { protocol: 'https', hostname: 's3.amazonaws.com' },
      { protocol: 'https', hostname: '*.s3.amazonaws.com' },
      { protocol: 'https', hostname: '*.s3.*.amazonaws.com' },
    ],
  },
};

export default nextConfig;
