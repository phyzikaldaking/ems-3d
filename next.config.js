/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@babylonjs/core', '@babylonjs/gui', '@babylonjs/loaders'],
};

module.exports = nextConfig;
