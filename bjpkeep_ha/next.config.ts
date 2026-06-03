import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    middlewareClientMaxBodySize: "50mb",
  },
  // Essential for Home Assistant Ingress to handle assets correctly
  trailingSlash: true,
};

export default nextConfig;
