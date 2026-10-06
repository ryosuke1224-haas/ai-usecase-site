import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a manual visit to 127.0.0.1 hydrate. QA signs in and tests on localhost.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
