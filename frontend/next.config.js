/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  webpack: (config) => {
    config.context = __dirname;
    config.resolve = config.resolve || {};
    config.resolve.modules = [
      path.join(__dirname, "node_modules"),
      "node_modules",
    ];
    return config;
  },
};

module.exports = nextConfig;
