require("dotenv").config();

const app = require("./app");
const { testConnection } = require("./config/database");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await testConnection();

  app.listen(PORT, () => {
    console.log(`API MediConnect démarrée sur http://localhost:${PORT}`);
  });
};

startServer();