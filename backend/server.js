require("dotenv").config();

const app = require("./app");
const { testConnection } = require("./config/database");
const { connectCache } = require("./services/cacheService");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await testConnection();
  connectCache();

  app.listen(PORT, () => {
    console.log(`API MediConnect démarrée sur http://localhost:${PORT}`);
  });
};

startServer();