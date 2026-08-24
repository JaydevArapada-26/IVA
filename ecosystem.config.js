const path = require('path');

const servePath = path.resolve(__dirname, 'node_modules/serve/build/main.js');

module.exports = {
  apps: [
    {
      name: 'iva-backend',
      cwd: path.resolve(__dirname, 'apps/backend'),
      script: 'dist/main.js',
      node_args: '--env-file=../../.env',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'iva-web',
      cwd: path.resolve(__dirname, 'apps/web'),
      script: servePath,
      args: 'out -l 3000',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'iva-admin',
      cwd: path.resolve(__dirname, 'apps/admin'),
      script: servePath,
      args: 'out -l 3001',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
