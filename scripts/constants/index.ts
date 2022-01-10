import { conf } from '../config';

const { env } = conf;

export const DIR = {
  SRC: 'src',
  TEMPLATE: 'template',
  STYLE: 'style',
  SCRIPT: 'script',
  DIST: 'dist',
  SHARED: 'shared'
} as const;

export const OUTPUT_DIR = env !== 'local' ? env : DIR.DIST;
export const DEFAULT_FILE = 'index';

export const EXTENSION = {
  PUG: '.pug',
  SCSS: '.scss',
  TS: '.ts',
  HTML: '.html',
  CSS: '.css',
  JS: '.js',
  IMAGE: '.{jpg,png,gif,svg,jpeg,ico}'
} as const;

export const COMMAND = {
  PUG_LINT: 'yarn lint:template'
} as const;
