import { merge } from 'webpack-merge';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import { InjectManifest } from 'workbox-webpack-plugin';
import common from './webpack.common.js';
import { APP_BUILD_NUMBER } from '../src/build-number.js';

export default merge(common, {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      // Setting extractComments to false avoids generating the *.LICENSE.txt file
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'APP_ENV': JSON.stringify('production'),
      'APP_BUILD_NUMBER': JSON.stringify(APP_BUILD_NUMBER)
    }),
    new InjectManifest({
      swSrc: './src/service-worker.js',
      swDest: 'service-worker.js',
      exclude: [/build\.txt$/],
    }),
  ]
});