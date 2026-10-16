import { merge } from 'webpack-merge';
import webpack from 'webpack';
import common from './webpack.common.js';
const port = Number(process.env.PORT ?? 5194);

export default merge(common, {
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
