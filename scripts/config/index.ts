type TEnv = 'local' | 'production';

export const conf = {
  port: 8080,
  env: process.env.NODE_ENV as TEnv
};
