module.exports = {
  apps: [
    {
      name: 'chessxu-paymaster',
      script: 'dist/index.js',
      // Scale to multiple instances for horizontal load balancing.
      // Redis-backed rate limiting ensures limits are shared across instances.
      instances: process.env.PM2_INSTANCES || 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Graceful shutdown — gives time for Redis pool cleanup
      kill_timeout: 5000,
      listen_timeout: 8000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
    },
  ],
};
