import type { NextConfig } from "next";

const configuredOrigins =
  process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  allowedDevOrigins: Array.from(
    new Set(["192.168.2.35", ...configuredOrigins]),
  ),
};

export default nextConfig;
