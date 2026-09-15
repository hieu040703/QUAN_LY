module.exports = {
  apps: [
    {
      name: "FIT_CLUP",
      script: "dist/index.js",
      instances: 1,
      watch: false,
      max_memory_restart: "2G",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
