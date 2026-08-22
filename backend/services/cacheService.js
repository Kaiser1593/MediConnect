// backend/services/cacheService.js
// Accès Redis : cache des créneaux de disponibilité affichés côté public,
// et liste noire des tokens JWT révoqués à la déconnexion.
//
// Composant NoSQL du projet (le reste de l'application est 100% MySQL).
// Règle impérative : Redis est un accélérateur, jamais une dépendance
// obligatoire. Toute panne de connexion ou de commande dégrade
// silencieusement le service (pas de cache / token jamais mis en liste
// noire) sans jamais faire échouer une requête HTTP ni crasher le
// serveur. C'est pour cette raison que les fonctions ci-dessous
// n'exposent que des opérations "best effort" : on ne lève jamais
// d'erreur, on renvoie simplement l'équivalent d'un cache vide.

const { createClient } = require("redis");

const REDIS_URL =
  process.env.REDIS_URL ||
  `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`;

const AVAILABILITY_TTL_SECONDS = 30;

let client = null;
let isReady = false;
let hasWarned = false;

const warnOnce = (error) => {
  if (hasWarned) return;
  hasWarned = true;
  console.warn(
    `Redis indisponible, l'application continue en mode dégradé (sans cache, sans liste noire de tokens) : ${error.message}`,
  );
};

// Appelée une seule fois au démarrage du serveur (server.js). Ne bloque
// jamais le démarrage : la connexion se fait en tâche de fond, et
// `client.on("error", ...)` empêche toute exception non gérée si Redis
// n'est pas joignable.
const connectCache = () => {
  if (client) return;

  client = createClient({
    url: REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 1000, 10000),
    },
  });

  client.on("error", (error) => {
    isReady = false;
    warnOnce(error);
  });
  client.on("ready", () => {
    isReady = true;
  });
  client.on("end", () => {
    isReady = false;
  });

  client.connect().catch((error) => warnOnce(error));
};

const availabilityKey = (doctorId, dateStr) => `dispo:${doctorId}:${dateStr}`;
const blacklistKey = (token) => `revoque:${token}`;

const getCachedAvailability = async (doctorId, dateStr) => {
  if (!isReady) return null;

  try {
    const raw = await client.get(availabilityKey(doctorId, dateStr));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    warnOnce(error);
    return null;
  }
};

const setCachedAvailability = async (doctorId, dateStr, slots) => {
  if (!isReady) return;

  try {
    await client.set(availabilityKey(doctorId, dateStr), JSON.stringify(slots), {
      EX: AVAILABILITY_TTL_SECONDS,
    });
  } catch (error) {
    warnOnce(error);
  }
};

// Appelée après toute réservation/annulation/replanification, pour que
// l'annuaire public ne montre jamais un créneau qui vient d'être pris
// pendant les 30 secondes de durée de vie du cache. Ne protège que
// l'affichage : la validation d'une réservation recalcule toujours les
// créneaux directement depuis MySQL (voir appointmentService), jamais
// depuis ce cache.
const invalidateAvailability = async (doctorId, dateStr) => {
  if (!isReady) return;

  try {
    await client.del(availabilityKey(doctorId, dateStr));
  } catch (error) {
    warnOnce(error);
  }
};

const blacklistToken = async (token, ttlSeconds) => {
  if (!isReady || ttlSeconds <= 0) return;

  try {
    await client.set(blacklistKey(token), "1", { EX: ttlSeconds });
  } catch (error) {
    warnOnce(error);
  }
};

// Si Redis est indisponible, on considère qu'aucun token n'est révoqué
// (mode dégradé) plutôt que de bloquer tout le monde : la signature et
// l'expiration du JWT restent, elles, toujours vérifiées normalement.
const isTokenBlacklisted = async (token) => {
  if (!isReady) return false;

  try {
    const value = await client.get(blacklistKey(token));
    return value !== null;
  } catch (error) {
    warnOnce(error);
    return false;
  }
};

module.exports = {
  connectCache,
  getCachedAvailability,
  setCachedAvailability,
  invalidateAvailability,
  blacklistToken,
  isTokenBlacklisted,
};
