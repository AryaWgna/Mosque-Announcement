import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    // Use webpack with polling for Docker compatibility
    webpack: (config, { isServer }) => {
        // Enable polling for file changes in Docker
        config.watchOptions = {
            poll: 1000,
            aggregateTimeout: 300,
        };
        return config;
    },
};

export default nextConfig;
