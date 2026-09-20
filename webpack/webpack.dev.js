const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const { devServerPort } = require('../devServerPort.cjs');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
    host: '0.0.0.0',
    port: devServerPort(),
  },
  plugins: [
    new webpack.DefinePlugin({
      'APP_ENV': JSON.stringify('development')
    }),
  ]
});
