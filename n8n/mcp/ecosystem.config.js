module.exports = {
  apps: [
    {
      name: 'jobspy',
      cwd: './jobspy-mcp-server',
      env: {
        ENABLE_SSE: 1,
      },
      watch: ['src'],
      // Delay between restart
      watch_delay: 1000,
      script: './src/index.js',
    },
    {
      name: 'steel',
      cwd: './steel-mcp-server',
      script: './dist/index.js',
      env: {
        STEEL_LOCAL: 'true',
        STEEL_API_KEY: 'local',
      },
    },
  ],
};
