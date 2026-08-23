// src/components/ProtectedRoute.test.jsx
// Vérifie qu'un utilisateur non authentifié est redirigé vers /connexion
// plutôt que de voir le contenu protégé.

import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import ProtectedRoute from "./ProtectedRoute";
import AuthContext from "../context/AuthContext";

const renderWithAuth = (authValue) =>
  render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={["/patient/dashboard"]}>
        <Routes>
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute>
                <p>Contenu protégé</p>
              </ProtectedRoute>
            }
          />
          <Route path="/connexion" element={<p>Page de connexion</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

describe("ProtectedRoute", () => {
  it("redirige vers /connexion un utilisateur non authentifié", () => {
    renderWithAuth({ isAuthenticated: false, isLoading: false, user: null });

    expect(screen.getByText("Page de connexion")).toBeInTheDocument();
    expect(screen.queryByText("Contenu protégé")).not.toBeInTheDocument();
  });

  it("affiche le contenu protégé pour un utilisateur authentifié", () => {
    renderWithAuth({
      isAuthenticated: true,
      isLoading: false,
      user: { role: "patient" },
    });

    expect(screen.getByText("Contenu protégé")).toBeInTheDocument();
  });

  it("n'affiche ni redirection ni contenu pendant la vérification de session", () => {
    renderWithAuth({ isAuthenticated: false, isLoading: true, user: null });

    expect(screen.queryByText("Page de connexion")).not.toBeInTheDocument();
    expect(screen.queryByText("Contenu protégé")).not.toBeInTheDocument();
  });
});
