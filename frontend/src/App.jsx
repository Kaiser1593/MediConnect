import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import DemoLayout from "./components/layout/DemoLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Chargées à la demande : chaque page ne part sur le réseau que la
// première fois qu'elle est visitée, au lieu de tout regrouper dans un
// seul gros fichier téléchargé dès l'accueil (éco-conception : moins de
// données transférées pour un visiteur qui ne consulte que 1 ou 2 pages).
import Home from "./pages/Home";
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const PatientDashboard = lazy(() => import("./pages/patient/PatientDashboard"));
const DoctorSearch = lazy(() => import("./pages/patient/DoctorSearch"));
const AppointmentBooking = lazy(() => import("./pages/patient/AppointmentBooking"));
const MyAppointments = lazy(() => import("./pages/patient/MyAppointments"));
const PatientProfile = lazy(() => import("./pages/patient/PatientProfile"));
const DoctorDashboard = lazy(() => import("./pages/doctor/DoctorDashboard"));
const MyAgenda = lazy(() => import("./pages/doctor/MyAgenda"));
const DoctorProfile = lazy(() => import("./pages/doctor/DoctorProfile"));
const DoctorPatients = lazy(() => import("./pages/doctor/DoctorPatients"));
const DoctorAvailabilities = lazy(() => import("./pages/doctor/DoctorAvailabilities"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminPatients = lazy(() => import("./pages/admin/AdminPatients"));
const AdminDoctors = lazy(() => import("./pages/admin/AdminDoctors"));
const AdminAppointments = lazy(() => import("./pages/admin/AdminAppointments"));
const AdminStatistics = lazy(() => import("./pages/admin/AdminStatistics"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

import "./App.css";

function App() {
  return (
    <div className="app">
      <Suspense fallback={<p className="route-loading">Chargement…</p>}>
      <Routes>
        <Route
          path="/"
          element={
            <DemoLayout>
              <Home />
            </DemoLayout>
          }
        />

        <Route
          path="/connexion"
          element={
            <DemoLayout>
              <Login />
            </DemoLayout>
          }
        />

        <Route
          path="/inscription"
          element={
            <DemoLayout>
              <Register />
            </DemoLayout>
          }
        />

        <Route
          path="/mot-de-passe-oublie"
          element={
            <DemoLayout>
              <ForgotPassword />
            </DemoLayout>
          }
        />

        <Route
          path="/reinitialisation/:token"
          element={
            <DemoLayout>
              <ResetPassword />
            </DemoLayout>
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
          path="/admin/patients"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPatients />
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
      </Suspense>
    </div>
  );
}

export default App;
