const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const port = Number(process.env.PORT ?? 5194);

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
    host: '0.0.0.0',
    allowedHosts: 'all',
    port,
  },
  plugins: [
    new webpack.DefinePlugin({
      'APP_ENV': JSON.stringify('development')
    }),
  ]
});
