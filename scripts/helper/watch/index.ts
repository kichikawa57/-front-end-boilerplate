import chalk from 'chalk';
import chokidar, { FSWatcher } from 'chokidar';

type TFuncs = {
  change: (path: string) => void;
  unlink?: (path: string) => void;
  error?: (path: string) => void;
};

export class Chokidar {
  private watch: FSWatcher;

  constructor(paths: string[]) {
    this.watch = chokidar.watch(paths);
  }

  get getWatch() {
    return this.watch;
  }

  public watcher({ change, unlink, error }: TFuncs) {
    this.watch
      .on('change', (path: string) => {
        change(path);
      })
      .on('unlink', async (path: string) => {
        unlink && unlink(path);
        await this.watch.close(); // watchを外す
        console.log(chalk.yellow(`✔︎ Watcher Close ${path}`));
      })
      .on('error', async (path: string) => {
        error && error(path);
        await this.watch.close(); // watchを外す
        process.kill(process.pid, 'SIGHUP');
        process.exit(0);
      });
  }
}
