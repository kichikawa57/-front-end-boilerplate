/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import imageminGifsicle from 'imagemin-gifsicle';
import imageminSvgo from 'imagemin-svgo';
import { err, log, ok, TResultPromise, writeFile } from '../helper/utils';
import { DIR, EXTENSION, OUTPUT_DIR } from '../constants';
import { conf } from '../config';

export const imageMin: () => Promise<TResultPromise<string, Error>> =
  async () => {
    const { env } = conf;

    if (env === 'local') return ok('');

    try {
      const results = await imagemin([`${DIR.SRC}/**/*${EXTENSION.IMAGE}`], {
        plugins: [
          imageminMozjpeg({ quality: 80 }),
          imageminPngquant({ quality: [0.65, 0.8] }),
          imageminGifsicle(),
          imageminSvgo()
        ]
      });

      const promises: Promise<TResultPromise<string, Error>>[] = [];

      for (const result of results) {
        const dist = result.sourcePath.replace(
          new RegExp(`${DIR.SRC}/`),
          `${OUTPUT_DIR}/`
        );

        promises.push(writeFile(dist, result.data));
      }

      await Promise.all(promises);

      log('success', 'build min images');
      return ok('success min images');
    } catch (e: unknown) {
      const error = e as Error;

      log('error', `error min image ${error.message}`);
      return err(new Error('error min images'));
    }
  };
