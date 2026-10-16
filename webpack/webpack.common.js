import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import GenerateBuildTxtFilePlugin from './buildtxt.plugin.js';

const envFile = path.resolve(import.meta.dirname, '../.env');
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
}

export default {
  entry: './src/index.js',
  plugins: [
    // Use the Html plugin so it injects the hashed script name
    new HtmlWebpackPlugin({
      template: 'src/index.ejs',
      templateParameters: {
        TUPSP_INCLUDE_SA: process.env.TUPSP_INCLUDE_SA === 'true'
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
    path: path.resolve(import.meta.dirname, '../dist'),
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
