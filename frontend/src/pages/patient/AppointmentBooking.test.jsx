// src/pages/patient/AppointmentBooking.test.jsx
// Vérifie que le bouton de confirmation reste désactivé tant que la
// sélection date + créneau n'est pas complète, et qu'il s'active une
// fois un créneau choisi.

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import AppointmentBooking from "./AppointmentBooking";
import AuthContext from "../../context/AuthContext";
import api from "../../services/api";

vi.mock("../../services/api", () => ({
  default: { get: vi.fn() },
}));

const DOCTOR = {
  id: 42,
  firstname: "Amandine",
  lastname: "Corre",
  full_name: "Dr Amandine Corre",
  specialty: "Médecine générale",
  city: "Paris",
  average_rating: null,
  consultation_price: "25.00",
};

const authValue = {
  user: { firstname: "Test", lastname: "Patient", role: "patient" },
  logout: vi.fn(),
};

const renderBooking = () =>
  render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={["/patient/reservation/42"]}>
        <Routes>
          <Route path="/patient/reservation/:doctorId" element={<AppointmentBooking />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

describe("AppointmentBooking", () => {
  it("désactive la confirmation tant qu'aucun créneau n'est sélectionné, puis l'active une fois un créneau choisi", async () => {
    api.get.mockImplementation((url) => {
      if (url === "/doctors/42") return Promise.resolve({ data: { doctor: DOCTOR } });
      if (url === "/doctors/42/reviews") return Promise.resolve({ data: { reviews: [] } });
      if (url === "/doctors/42/availability") {
        return Promise.resolve({ data: { slots: ["09:00", "09:30"] } });
      }
      return Promise.reject(new Error(`URL inattendue : ${url}`));
    });

    const user = userEvent.setup();
    renderBooking();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Dr Amandine Corre" })).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: /confirmer le rendez-vous/i });

    // Une date est déjà présélectionnée (aujourd'hui), mais aucun horaire :
    // le bouton doit rester désactivé.
    expect(confirmButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "09 h 00" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "09 h 00" }));

    expect(confirmButton).toBeEnabled();
  });
});
