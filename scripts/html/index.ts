import path from 'path';
import { IOptions } from 'glob';

import Pug from 'pug';

import {
  getDirsSync,
  readFile,
  ok,
  err,
  TResultPromise,
  writeFile,
  exec,
  log
} from '../helper/utils';
import {
  COMMAND,
  DIR,
  EXTENSION,
  OUTPUT_DIR,
  DEFAULT_FILE
} from '../constants';
import { Chokidar } from '../helper/watch';
import { data } from '../../src/data';

// pugのレンダリング
const render = (entry: string, outDir: string, outPath: string) => {
  return new Promise<TResultPromise<string, Error>>(async (resolve) => {
    const readFileResult = await readFile(entry);

    if (readFileResult.reject || !readFileResult.resolve) {
      resolve(err(readFileResult.reject));
      return;
    }

    const html = readFileResult.resolve;
    const distFile = `${path.join(OUTPUT_DIR, outDir)}${outPath}`;

    Pug.render(
      html,
      {
        pretty: true,
        cache: false,
        basedir: path.join(DIR.SRC),
        data
        // data: jsonData()
      },
      async (error, data) => {
        if (error) {
          log('error', `pug render Error ${entry})`);
          log('error', error.message);
          resolve(err(error));
          return;
        }

        const writeFileResult = await writeFile(distFile, data);

        if (writeFileResult.reject && writeFileResult.err) {
          log('error', `pug writeFile Error ${entry})`);
          log('error', writeFileResult.reject.message);
          resolve(err(writeFileResult.reject));
          return;
        }

        log('success', `build template ${distFile}`);
        resolve(ok(distFile));
      }
    );
  });
};

// レンダリングに必要なパスを生成
const getPath = (dir: string) => {
  const fileName = dir.split('/').pop() || `${DEFAULT_FILE}${EXTENSION.PUG}`;

  const outputPath =
    dir
      .replace(new RegExp(`${DIR.SRC}/`), '')
      .replace(new RegExp(`${DIR.TEMPLATE}/`), '')
      .replace(new RegExp(`${fileName}`), '') || '/';

  const outPutFile = fileName.replace(
    new RegExp(EXTENSION.PUG),
    EXTENSION.HTML
  );

  return { fileName, outputPath, outPutFile };
};

// 複数のpugをレンダリング
export const renderPugs = async (
  entry: string,
  option: IOptions = {}
): Promise<TResultPromise<string, Error>> => {
  const { resolve, reject } = await getDirsSync(entry, option);

  if (reject || !resolve) {
    log('error', `pug get dirs Error ${reject ? reject.message : ''})`);
    return err(reject);
  }

  // validate
  const execResult = await exec(COMMAND.PUG_LINT);

  if (execResult.reject && execResult.err) {
    log('error', `pug validator Error`);
    log('error', execResult.reject.message);
    return err(execResult.reject);
  }

  const promises: Promise<TResultPromise<string, Error>>[] = [];

  for (const dir of resolve) {
    const { outputPath, outPutFile } = getPath(dir);

    promises.push(render(dir, outputPath, outPutFile));
  }

  const results = await Promise.all(promises);

  // エラーチェック
  const errs = results.filter((r) => r.err);
  if (errs.length !== 0) return err(errs[0].reject);

  return ok('✔︎ success to html renders');
};

// 指定したパスのpugをレンダリング
export const renderPug = async (
  entry: string
): Promise<TResultPromise<string, Error>> => {
  // validate
  const execResult = await exec(COMMAND.PUG_LINT);

  if (execResult.reject && execResult.err) {
    log('error', `pug validator Error`);
    log('error', execResult.reject.message);
    return err(execResult.reject);
  }

  const { outPutFile, outputPath } = getPath(entry);

  const renderResult = await render(entry, outputPath, outPutFile);

  // エラーチェック
  if (renderResult.err && renderResult.reject) return err(renderResult.reject);

  return ok('✔︎ success to html render');
};

// 変更を監視
export const watchPug = async (entry: string, option: IOptions = {}) => {
  const { resolve, reject } = await getDirsSync(entry, option);

  if (reject || !resolve) {
    log('error', `pug get dirs Error ${reject ? reject.message : ''}`);
    return err(reject);
  }

  const sharedDir = await getDirsSync(
    `${DIR.SRC}/${DIR.SHARED}/**/*${EXTENSION.PUG}`,
    {}
  );

  if (sharedDir.reject || !sharedDir.resolve) {
    log(
      'error',
      `pug get dirs Error ${sharedDir.reject ? sharedDir.reject.message : ''}`
    );
    return err(reject);
  }

  const chokidar = new Chokidar(resolve);

  chokidar.watcher({
    change: async (path: string) => {
      log('success', `entry template ${path}`);

      await renderPugs(
        `${path.split(DIR.TEMPLATE)[0]}/${DIR.TEMPLATE}/**/*${EXTENSION.PUG}`,
        {
          ignore: [
            `${path.split(DIR.TEMPLATE)[0]}/${DIR.TEMPLATE}/**/_*${
              EXTENSION.PUG
            }`
          ]
        }
      );
    }
  });

  const chokidarShared = new Chokidar(sharedDir.resolve);

  chokidarShared.watcher({
    change: async () => {
      log('success', `entry template all`);
      await renderPugs(entry, option);
    }
  });

  log('success', `watch start template`);
};
