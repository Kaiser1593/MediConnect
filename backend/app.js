const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Bienvenue sur l'API MediConnect",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "L'API MediConnect fonctionne correctement",
  });
});

app.use("/api/auth", authRoutes);

module.exports = app;