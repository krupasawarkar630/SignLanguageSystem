/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false, // Fallback to Terser. SWC crashes on pre-minified MediaPipe WASM bundles
  experimental: {
    serverComponentsExternalPackages: ["onnxruntime-web", "@mediapipe/tasks-vision"],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Ignore the ONNX pre-minified Node.js specific file from Webpack processing
    config.module.rules.push({
      test: /ort\.node\.min\.mjs$/,
      type: "javascript/auto",
      use: "ignore-loader",
    });

    return config;
  },
};

module.exports = nextConfig;
