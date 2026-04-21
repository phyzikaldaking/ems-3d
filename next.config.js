const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@babylonjs/core', '@babylonjs/gui', '@babylonjs/loaders'],
  generateBuildId: async () => `ems-${Date.now()}`,
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
};

module.exports = nextConfig;
