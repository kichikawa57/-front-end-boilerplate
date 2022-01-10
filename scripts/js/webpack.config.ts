import webpack, { Configuration } from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import ESLintPlugin from 'eslint-webpack-plugin';
import path from 'path';

import { getDirsSync } from '../helper/utils';
import { DIR, EXTENSION, OUTPUT_DIR, DEFAULT_FILE } from '../constants';
import { conf } from '../config';

const { env } = conf;

const defaultStatsOptions = {
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

const isProduction = env !== 'local';

const entries = async () => {
  const entries: { [key: string]: string } = {};

  const ignore = isProduction
    ? [`${DIR.SRC}/**/_*${EXTENSION.TS}`, `${DIR.SRC}/${DIR.SHARED}/**`]
    : [`${DIR.SRC}/**/_*${EXTENSION.TS}`];

  const entryPath = isProduction
    ? `${DIR.SRC}/**/${DIR.SCRIPT}/${DEFAULT_FILE}${EXTENSION.TS}`
    : `${DIR.SRC}/**/*${EXTENSION.TS}`;

  const { resolve } = await getDirsSync(entryPath, {
    ignore
  });

  if (!resolve) return entries;

  for (const dir of resolve) {
    const regEx = new RegExp(`${DIR.SRC}/`);
    const key = dir.replace(regEx, '').replace('.ts', '.js');

    entries[key] = `${path.resolve('')}/${dir}`;
  }

  return entries;
};

const webpackConf: Configuration = {
  entry: async () => await entries(),
  mode: isProduction ? 'production' : 'development',
  output: {
    path: `${path.resolve('')}/${OUTPUT_DIR}`,
    filename: '[name]',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        loader: 'ts-loader'
      },
      {
        test: /\.(vert|frag|glsl)$/i,
        use: [{ loader: 'raw-loader' }, { loader: 'glslify-loader' }],
        exclude: /node_modules/
      }
    ]
  },
  optimization: {
    splitChunks: {
      name: 'shared/script/vendor.js',
      chunks: 'initial',
      cacheGroups: {
        default: false
      }
    },
    minimize: isProduction,
    minimizer: [
      new TerserPlugin({
        extractComments: 'all',
        terserOptions: {
          compress: {
            drop_console: true
          }
        }
      })
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.ENV': JSON.stringify(process.env.NODE_ENV)
    }),
    new ESLintPlugin({
      extensions: ['.ts', '.js'],
      exclude: 'node_modules',
      fix: true
    })
  ],
  stats: defaultStatsOptions,
  resolve: {
    modules: [path.resolve(DIR.SRC), 'node_modules'],
    extensions: [EXTENSION.TS, EXTENSION.JS]
  }
};

export default webpackConf;
