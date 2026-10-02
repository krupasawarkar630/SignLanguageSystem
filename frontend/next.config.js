/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prepare for WASM/ONNX if needed in future phases
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
};

module.exports = nextConfig;
