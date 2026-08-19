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
import PatientProfile from "./pages/patient/PatientProfile";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import MyAgenda from "./pages/doctor/MyAgenda";
import DoctorProfile from "./pages/doctor/DoctorProfile";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorAvailabilities from "./pages/doctor/DoctorAvailabilities";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDoctors from "./pages/admin/AdminDoctors";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminStatistics from "./pages/admin/AdminStatistics";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminSettings from "./pages/admin/AdminSettings";

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

        <Route
          path="/patient/profil"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientProfile />
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

        <Route
          path="/doctor/profil"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/patients"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorPatients />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/disponibilites"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorAvailabilities />
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

        <Route
          path="/admin/utilisateurs"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/medecins"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDoctors />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/rendez-vous"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminAppointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/statistiques"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminStatistics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/journaux"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLogs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/parametres"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
