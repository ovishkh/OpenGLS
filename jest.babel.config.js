/**
 * jest.babel.config.js
 * Babel configuration for Jest tests only
 * This is NOT used by Next.js build
 */
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
    "@babel/preset-typescript",
  ],
  plugins: [],
};
