const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const { InjectManifest } = require('workbox-webpack-plugin');
const { APP_BUILD_NUMBER } = require('../src/build-number.js');

module.exports = merge(common, {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'APP_ENV': JSON.stringify('staging'),
      'APP_BUILD_NUMBER': JSON.stringify(APP_BUILD_NUMBER)
    }),
    new InjectManifest({
      swSrc: './src/service-worker.js',
      swDest: 'service-worker.js',
      exclude: [/build\.txt$/],
    }),
  ]
});
