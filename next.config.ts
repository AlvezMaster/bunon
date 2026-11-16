import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    // Old page addresses from before the factory / buyer split.
    return [
      { source: "/supplier", destination: "/factory", permanent: false },
      { source: "/buyer-terminal", destination: "/buyer", permanent: false },
      { source: "/audit-logs", destination: "/ledger", permanent: false },
      { source: "/settings", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
