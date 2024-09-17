const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
  resolve: {
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      fs: false,
      vm: require.resolve('vm-browserify'),
      stream: require.resolve('stream-browserify'),
    }
  },
  plugins: [
    new NodePolyfillPlugin() // This adds polyfills for Node.js core modules.
  ]
};
