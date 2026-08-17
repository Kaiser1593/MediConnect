// src/context/AuthContext.js
// Le contexte seul, dans son propre fichier.
// Cela évite un avertissement de Fast Refresh, qui n'aime pas
// qu'un fichier .jsx exporte autre chose que des composants.

import { createContext } from "react";

const AuthContext = createContext(null);

export default AuthContext;