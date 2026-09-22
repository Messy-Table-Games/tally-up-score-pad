const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const pkg = require('../package.json');
const port = Number(process.env.DEVSERVER_PORT ?? pkg.devserver.port);

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
    host: '0.0.0.0',
    port,
  },
  plugins: [
    new webpack.DefinePlugin({
      'APP_ENV': JSON.stringify('development')
    }),
  ]
});
