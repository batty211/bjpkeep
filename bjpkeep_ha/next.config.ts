import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    middlewareClientMaxBodySize: "50mb",
  },
  // Forces Next.js to use relative paths for assets, 
  // which is required for Home Assistant Ingress
  assetPrefix: "./",
  trailingSlash: true,
};

export default nextConfig;
