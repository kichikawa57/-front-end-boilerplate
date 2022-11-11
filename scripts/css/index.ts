/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import path from 'path';
import sass from 'node-sass';
import postcss, { ProcessOptions, AcceptedPlugin } from 'postcss';
import postScss from 'postcss-scss';
import autoPrefixer from 'autoprefixer';
import cssDeclarationSorter from 'css-declaration-sorter';
import { IOptions } from 'glob';
import { DIR, EXTENSION, OUTPUT_DIR, DEFAULT_FILE } from '../constants';
import {
  err,
  getDirsSync,
  ok,
  TResultPromise,
  writeFile,
  readFile,
  log
} from '../helper/utils';
import postcssReporter from 'postcss-reporter';
import nested from 'postcss-nested';
import cssnano from 'cssnano';
import { Chokidar } from '../helper/watch';

const styleLintPlugin: AcceptedPlugin[] = [
  require('stylelint'),
  postcssReporter({ clearReportedMessages: true })
];

const postCssPlugin: AcceptedPlugin[] = [
  postcssReporter({ clearReportedMessages: true }),
  cssDeclarationSorter({ order: 'smacss' }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cssnano({ preset: 'default' }) as any,
  autoPrefixer(['last 2 versions', 'ie >= 11', 'Android >= 4']),
  nested()
];

const postCssOption: ProcessOptions = {
  from: '/',
  to: '/',
  map: false,
  syntax: postScss
};

// postCssのレンダリング処理
const renderPostCss = (
  css: string,
  plugins: AcceptedPlugin[],
  option: ProcessOptions
) => {
  return new Promise<TResultPromise<string, Error>>((resolve) => {
    postcss(plugins)
      .process(css, option)
      .then((result) => resolve(ok(result.css)))
      .catch((e) => resolve(err(new Error(e as string))));
  });
};

// scssのレンダリング処理
const renderSass = (entry: string) => {
  return new Promise<TResultPromise<string, Error>>((resolve) => {
    sass.render({ file: entry }, (error, result) => {
      if (error) {
        log('error', `sass render Error ${entry})`);
        log('error', error.message);
        resolve(err(new Error(error.message)));
        return;
      }

      const data = result.css.toString();

      resolve(ok(data));
    });
  });
};

// scss、postcssのレンダリングを統合
const render = async (
  entry: string,
  outDir: string,
  outPath: string
): Promise<TResultPromise<string, Error>> => {
  const file = await readFile(entry);

  if (!file.resolve) {
    log('error', `style readFile Error ${entry})`);
    return err(file.reject);
  }

  const styleLintResult = await renderPostCss(
    file.resolve,
    styleLintPlugin,
    postCssOption
  );

  if (styleLintResult.reject && styleLintResult.err) {
    log('error', `stylelint Error ${entry}`);
    log('error', styleLintResult.reject.message);
    return err(styleLintResult.reject);
  }

  const sassRenderResult = await renderSass(entry);

  if (!sassRenderResult.resolve) {
    log('error', `scss render Error ${entry}`);
    return err(sassRenderResult.reject);
  }

  const postCssResult = await renderPostCss(
    sassRenderResult.resolve,
    postCssPlugin,
    postCssOption
  );

  if (!postCssResult.resolve) {
    log('error', `postCss Error ${entry}`);
    log(
      'error',
      postCssResult.reject ? postCssResult.reject.message : 'no error'
    );
    return err(postCssResult.reject);
  }

  const distFile = `${path.join(OUTPUT_DIR, outDir)}${outPath}`;

  const writeFileResult = await writeFile(distFile, postCssResult.resolve);

  if (writeFileResult.reject && writeFileResult.err) {
    log('error', `scss writeFile Error ${entry}`);
    return err(writeFileResult.reject);
  }

  log('success', `build style ${distFile}`);

  return ok('css render success');
};

// レンダリングに必要なパスを生成
const getPath = (dir: string) => {
  const fileName = dir.split('/').pop() || `${DEFAULT_FILE}${EXTENSION.SCSS}`;

  const outputPath =
    dir
      .replace(new RegExp(`${DIR.SRC}/`), '')
      .replace(new RegExp(`${fileName}`), '') || '/';

  const outPutFile = fileName.replace(
    new RegExp(EXTENSION.SCSS),
    EXTENSION.CSS
  );

  return { fileName, outputPath, outPutFile };
};

// 複数のcssをレンダリング
export const renderStyles = async (
  entry: string,
  option: IOptions = {}
): Promise<TResultPromise<string, Error>> => {
  const { resolve, reject } = await getDirsSync(entry, option);

  if (reject || !resolve) {
    log('error', `scss get dirs Error ${reject ? reject.message : ''}`);
    return err(reject);
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

  return ok('success to css renders');
};

// 指定したパスのcssをレンダリング
export const renderStyle = async (
  entry: string
): Promise<TResultPromise<string, Error>> => {
  const { outPutFile, outputPath } = getPath(entry);

  const renderResult = await render(entry, outputPath, outPutFile);

  // エラーチェック
  if (renderResult.err && renderResult.reject) return err(renderResult.reject);

  return ok('success to template render');
};

// 変更を監視
export const watchStyle = async (entry: string, option: IOptions = {}) => {
  const { resolve, reject } = await getDirsSync(entry, option);

  if (reject || !resolve) {
    log('error', `pug get dirs Error ${reject ? reject.message : ''}`);
    return err(reject);
  }

  const sharedDir = await getDirsSync(
    `${DIR.SRC}/${DIR.SHARED}/**/*${EXTENSION.SCSS}`,
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
      log('success', `entry style ${path}`);
      console.log(path.split(DIR.STYLE));

      await renderStyles(
        `${path.split(DIR.STYLE)[0]}/${DIR.STYLE}/**/*${EXTENSION.SCSS}`,
        {
          ignore: [
            `${path.split(DIR.STYLE)[0]}/${DIR.STYLE}/**/_*${EXTENSION.SCSS}`
          ]
        }
      );
    }
  });

  const chokidarShared = new Chokidar(sharedDir.resolve);

  chokidarShared.watcher({
    change: async () => {
      log('success', `entry style all`);
      await renderStyles(entry, {
        ...option,
        ignore: option.ignore
          ? typeof option.ignore === 'string'
            ? [`${DIR.SRC}/${DIR.SHARED}/**/_*${EXTENSION.SCSS}`, option.ignore]
            : [
                `${DIR.SRC}/${DIR.SHARED}/**/_*${EXTENSION.SCSS}`,
                ...option.ignore
              ]
          : [`${DIR.SRC}/${DIR.SHARED}/**/_*${EXTENSION.SCSS}`]
      });
    }
  });

  log('success', `watch start style`);
};
