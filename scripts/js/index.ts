import webpack from 'webpack';

import webpackConf from './webpack.config';
import { ok, err, TResultPromise, log } from '../helper/utils';
import { conf } from '../config';

const { env } = conf;

export const jsRenders = () => {
  return new Promise<TResultPromise<string, Error>>((resolve) => {
    if (env === 'local') return resolve(ok('build script'));

    webpack(webpackConf).run((_, stats) => {
      if (!stats) return resolve(ok('success script'));

      if (stats.hasErrors()) {
        const errors = stats.toJson().errors;

        if (errors) {
          for (const error of errors) {
            log('error', error.message);
          }
        }

        resolve(err(new Error(`error script render`)));
        return;
      }

      log('success', 'build script');

      resolve(ok('build script'));
    });
  });
};
