import mkdirp from 'mkdirp';
import fs from 'fs';
import path from 'path';

import glob, { IOptions } from 'glob';
import { exec as execProcess } from 'child_process';
import chalk from 'chalk';

type TLogType = 'success' | 'error' | 'warning';

export type TResult<T = null, K = null> = {
  ok: boolean;
  err: boolean;
  resolve: T;
  reject: K;
};

export type TResultPromise<T, K> = TResult<T | null, K | null>;

export const ok: <T = null>(value: T) => TResult<T> = <T = null>(value: T) => {
  return {
    ok: true,
    err: false,
    resolve: value,
    reject: null
  };
};

export const err: <T = Error>(value: T) => TResult<null, T> = <T = Error>(
  value: T
) => {
  return {
    ok: false,
    err: true,
    resolve: null,
    reject: value
  };
};

export const log = (type: TLogType, text: string) => {
  switch (type) {
    case 'success':
      console.log(chalk.greenBright(`✔︎ ${text}`));
      break;

    case 'error':
      console.error(chalk.red(`✖︎ ${text}`));
      break;

    case 'warning':
      console.warn(chalk.yellow(`▲ ${text}`));
      break;
  }
};

export const getDirsSync = (path: string, option: IOptions) => {
  return new Promise<TResultPromise<string[], Error>>((resolve) => {
    glob(path, option, (error: Error | null, dirs: string[]): void => {
      if (error) {
        resolve(err(error));
        return;
      }

      resolve(ok(dirs));
    });
  });
};

export const createDir = async (file: string) => {
  try {
    const made = await mkdirp(path.dirname(file));
    return ok(made || 'create');
  } catch (e) {
    return err(new Error('fail to mkdirp'));
  }
};

export const checkDir = (dir: string) => fs.existsSync(path.join(dir));

export const writeFile = <T>(file: string, data: T) => {
  return new Promise<TResultPromise<string, Error>>(async (resolve) => {
    const createDirResult = await createDir(file);

    if (!createDirResult.reject && createDirResult.err) {
      resolve(err(createDirResult.reject));
      return;
    }

    const buf = data as unknown as string;

    fs.writeFile(file, buf, (error: NodeJS.ErrnoException | null) => {
      if (error) {
        resolve(err(error));
        return;
      }

      resolve(ok(file));
    });
  });
};

export const readFile = (entry: string) => {
  return new Promise<TResultPromise<string, Error>>((resolve) => {
    fs.readFile(
      entry,
      'utf-8',
      (error: NodeJS.ErrnoException | null, html: string) => {
        if (error) {
          resolve(err(error));
          return;
        }

        resolve(ok(html));
      }
    );
  });
};

export const exec = (command: string) => {
  return new Promise<TResultPromise<string, Error>>((resolve) => {
    execProcess(command, (error, stdout, stderr) => {
      if (error) {
        resolve(err(new Error(stderr)));
        return;
      }

      resolve(ok(stdout));
    });
  });
};
