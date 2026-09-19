const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
    host: '0.0.0.0',
    // Explicit so we don't land on webpack-dev-server's 8080 default.
    port: 5197
  },
  plugins: [
    new webpack.DefinePlugin({
      'APP_ENV': JSON.stringify('development')
    }),
  ]
});
