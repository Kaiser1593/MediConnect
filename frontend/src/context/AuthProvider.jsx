// src/context/AuthProvider.jsx
// Détient l'état de l'utilisateur connecté et le partage
// à toute l'application.

import { useState, useEffect, useCallback, useMemo } from "react";

import AuthContext from "./AuthContext";
import api from "../services/api";

const TOKEN_KEY = "mediconnect_token";
const USER_KEY = "mediconnect_user";

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // isLoading évite un clignotement : au premier rendu on ne sait pas
  // encore si l'utilisateur est connecté. Sans ce drapeau, une route
  // protégée redirigerait vers /connexion avant la vérification.
  const [isLoading, setIsLoading] = useState(true);

  // Au démarrage, on relit le token stocké et on demande à l'API
  // qui est l'utilisateur. On ne fait pas confiance au localStorage
  // seul : le token peut avoir expiré depuis la dernière visite.
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        setUser(response.data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Appelée par Login et Register une fois l'API répondue.
  const login = useCallback((token, userData) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // useMemo évite de recréer l'objet à chaque rendu, ce qui
  // provoquerait le re-rendu de tous les composants consommateurs.
  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
