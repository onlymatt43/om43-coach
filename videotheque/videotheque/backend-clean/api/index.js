try {
  const serverless = require('serverless-http');
  const app = require('../app');
  module.exports = serverless(app);
} catch (err) {
  console.error('serverless wrapper init failed', err?.message || err);
  throw err;
}
