// src/pages/auth/Login.test.jsx
// Vérifie qu'une tentative de connexion avec des identifiants invalides
// affiche le message d'erreur renvoyé par l'API, sans rediriger l'utilisateur.

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Login from "./Login";
import AuthContext from "../../context/AuthContext";
import api from "../../services/api";

vi.mock("../../services/api", () => ({
  default: { post: vi.fn() },
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <AuthContext.Provider value={{ login: vi.fn() }}>
        <Login />
      </AuthContext.Provider>
    </MemoryRouter>,
  );

describe("Login", () => {
  it("affiche le message d'erreur renvoyé par l'API quand les identifiants sont invalides", async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { message: "Adresse e-mail ou mot de passe incorrect." } },
    });

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText("Adresse e-mail"), "patient@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "mauvais-mot-de-passe");
    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Adresse e-mail ou mot de passe incorrect."),
      ).toBeInTheDocument();
    });

    expect(api.post).toHaveBeenCalledWith("/auth/login", {
      email: "patient@example.com",
      password: "mauvais-mot-de-passe",
    });
  });
});
