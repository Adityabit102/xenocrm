import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    
    ignoreBuildErrors: true,
  },
  eslint: {
    
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "*",
        pathname: "/**",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
};

export default nextConfig;
