const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const specialtyRoutes = require("./routes/specialtyRoutes");

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

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/specialties", specialtyRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;