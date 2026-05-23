module.exports = {
  apps: [
    {
      name: 'chessxu-paymaster',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
