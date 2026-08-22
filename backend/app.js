const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const patientRoutes = require("./routes/patientRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const specialtyRoutes = require("./routes/specialtyRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();

app.use(helmet());

// 5173 = serveur Vite en développement, 8080 = frontend servi par Nginx
// dans le conteneur Docker (voir docker-compose.yml). CORS_ORIGIN permet
// d'ajouter d'autres origines (ex. un nom de domaine) sans toucher au code.
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  // 5174 : Vite passe automatiquement à ce port si un autre serveur de
  // dev occupe déjà le 5173 (deux instances lancées en parallèle).
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : []),
];

app.use(
  cors({
    origin: allowedOrigins,
  }),
);

// Compresse les réponses JSON (listes de médecins, rendez-vous...) :
// moins d'octets transférés, donc moins d'énergie consommée sur le
// réseau et côté client, dans une optique d'éco-conception.
app.use(compression());

app.use(express.json());

// express.json() ne pose req.body que si Content-Type: application/json
// est présent. Une requête sans corps (ex. PATCH sans -d) laisse sinon
// req.body à undefined, et le déstructurer plante n'importe quel
// contrôleur avec un 500 au lieu d'un 400 propre.
app.use((req, res, next) => {
  if (!req.body) req.body = {};
  next();
});

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
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/specialties", specialtyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;