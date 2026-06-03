import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    middlewareClientMaxBodySize: "50mb",
  },
  // Forces Next.js to use relative paths for its internal chunks and assets.
  // This is CRITICAL for Home Assistant Ingress to correctly route requests.
  assetPrefix: "./",
  trailingSlash: true,
};

export default nextConfig;
