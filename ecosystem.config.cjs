module.exports = {
  apps: [
    {
      name: 'laundry-api',
      cwd: './apps/api',
      script: 'dist/server.js',
      instances: 1,
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
    {
      name: 'laundry-web',
      cwd: './apps/web',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
