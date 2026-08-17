// src/hooks/useAuth.js
// Raccourci pour lire le contexte, avec un garde-fou :
// si on oublie d'englober l'application dans AuthProvider,
// on obtient un message clair plutôt qu'un "cannot read property of null".

import { useContext } from "react";

import AuthContext from "../context/AuthContext";

function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider.");
  }

  return context;
}

export default useAuth;