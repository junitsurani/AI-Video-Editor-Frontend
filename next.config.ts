import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone",
  webpack(config) {
    // Allow builds on development machines with very little free disk space.
    if (process.env.FRAME_DISABLE_WEBPACK_CACHE === "1") config.cache = false;
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_INTERNAL_URL || "http://127.0.0.1:5001"}/api/:path*`,
      },
    ];
  },
};
export default nextConfig;
