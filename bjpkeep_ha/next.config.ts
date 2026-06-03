import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "50mb",
  },
  // Use the ASSET_PREFIX env var if set, otherwise fallback to empty
  assetPrefix: process.env.ASSET_PREFIX || "",
  trailingSlash: true,
};

export default nextConfig;
