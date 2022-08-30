/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */

import browserSync from 'browser-sync';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';

import webpackConfig from '../js/webpack.config';
import { DIR } from '../constants';

import { conf } from '../config';

const defaultStatsOptions = {
  colors: true,
  hash: false,
  timings: false,
  chunks: false,
  chunkModules: false,
  modules: false,
  children: true,
  version: true,
  cached: true,
  cachedAssets: true,
  reasons: true,
  source: true,
  errorDetails: true
};

export const browser = () => {
  const bundle = webpack(webpackConfig);

  const { port } = conf;

  // webpack-dev-middlewareのwebpackと少しバージョンが違う為型が合わない
  const webpackDevMiddlewareBundle: any = bundle;

  browserSync({
    notify: false,
    port,
    open: false,
    reloadOnRestart: true,
    ghostMode: {
      clicks: false,
      forms: false,
      scroll: false
    },
    server: {
      baseDir: [DIR.SRC, DIR.DIST],
      middleware: [
        webpackDevMiddleware(webpackDevMiddlewareBundle, {
          publicPath: '/',
          stats: defaultStatsOptions
        })
      ]
    }
  });
};
