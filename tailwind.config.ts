/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transformers.js ships optional native deps (onnxruntime-node, sharp) that
  // are meant for Node. We run fully in the browser, so stub them out so the
  // client bundle stays clean and Vercel builds don't choke on them.
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      'onnxruntime-node$': false,
    };
    // Allow large WASM model assets to be served as static files.
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
