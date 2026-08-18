import { Route, Routes } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import PatientDashboard from "./pages/patient/PatientDashboard";
import DoctorSearch from "./pages/patient/DoctorSearch";
import AppointmentBooking from "./pages/patient/AppointmentBooking";
import MyAppointments from "./pages/patient/MyAppointments";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import MyAgenda from "./pages/doctor/MyAgenda";
import AdminDashboard from "./pages/admin/AdminDashboard";

import "./App.css";

// Petit utilitaire pour ne pas répéter Navbar et Footer.
function PublicPage({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

function App() {
  return (
    <div className="app">
      <Routes>
        <Route
          path="/"
          element={
            <PublicPage>
              <Home />
            </PublicPage>
          }
        />

        <Route
          path="/connexion"
          element={
            <PublicPage>
              <Login />
            </PublicPage>
          }
        />

        <Route
          path="/inscription"
          element={
            <PublicPage>
              <Register />
            </PublicPage>
          }
        />

        {/* Espace patient */}
        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/medecins"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <DoctorSearch />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/reservation/:doctorId"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <AppointmentBooking />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/rendez-vous"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <MyAppointments />
            </ProtectedRoute>
          }
        />

        {/* Espace médecin */}
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/agenda"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <MyAgenda />
            </ProtectedRoute>
          }
        />

        {/* Espace administrateur */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
