const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const GenerateBuildTxtFilePlugin = require('./buildtxt.plugin.js');

module.exports = {
  entry: './src/index.js',
  plugins: [
    // Use the Html plugin so it injects the hashed script name
    new HtmlWebpackPlugin({
      template: 'src/index.ejs',
    }),
    new GenerateBuildTxtFilePlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'assets/Icon-192x192.png', to: 'Icon-192x192.png' },
        { from: 'assets/Icon-512x512.png', to: 'Icon-512x512.png' },
        { from: 'assets/Icon-180x180.png', to: 'Icon-180x180.png' },
        { from: 'assets/favicon.ico', to: 'favicon.ico' }
      ]
    })
  ],
  output: {
    filename: 'bundle.[contenthash].js', 
    path: path.resolve(__dirname, '../dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|svg|ico)$/i,
        type: 'asset/resource'
      },
    ],
  }
};
