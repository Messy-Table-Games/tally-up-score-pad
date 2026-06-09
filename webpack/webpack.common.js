const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const envFile = path.resolve(__dirname, '../.env');
if (fs.existsSync(envFile)) {
  require('dotenv').config({ path: envFile });
}
const CopyWebpackPlugin = require('copy-webpack-plugin');
const GenerateBuildTxtFilePlugin = require('./buildtxt.plugin.js');

module.exports = {
  entry: './src/index.js',
  plugins: [
    // Use the Html plugin so it injects the hashed script name
    new HtmlWebpackPlugin({
      template: 'src/index.ejs',
      templateParameters: {
        TUPSP_INCLUDE_SA: !!process.env.TUPSP_INCLUDE_SA
      }
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
