const app = require('./app');
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`backend-clean: server running on http://localhost:${PORT}`);
  console.log(`Running from: ${__dirname}`);
});
