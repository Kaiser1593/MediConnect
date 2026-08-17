// src/services/api.js

import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 8000,
});

// INTERCEPTEUR DE REQUÊTE
// Ajoute le token à chaque appel, automatiquement.
// Sans lui, il faudrait écrire le header Authorization à la main
// dans chaque composant.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mediconnect_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// INTERCEPTEUR DE RÉPONSE
// Si l'API répond 401, le token est expiré ou invalide :
// on nettoie et on renvoie vers la connexion.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("mediconnect_token");
      localStorage.removeItem("mediconnect_user");

      // On évite une boucle si on est déjà sur la page de connexion.
      if (window.location.pathname !== "/connexion") {
        window.location.href = "/connexion";
      }
    }

    return Promise.reject(error);
  },
);

export default api;