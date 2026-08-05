import { Route, Routes } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import PatientDashboard from "./pages/patient/PatientDashboard";
import DoctorSearch from "./pages/patient/DoctorSearch";
import AppointmentBooking from "./pages/patient/AppointmentBooking";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import "./App.css";

function App() {
  return (
    <div className="app">
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Home />
              <Footer />
            </>
          }
        />

        <Route
          path="/connexion"
          element={
            <>
              <Navbar />
              <Login />
              <Footer />
            </>
          }
        />

        <Route
          path="/inscription"
          element={
            <>
              <Navbar />
              <Register />
              <Footer />
            </>
          }
        />

        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/patient/medecins" element={<DoctorSearch />} />

        <Route path="/patient/reservation" element={<AppointmentBooking />} />

        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />

        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}

export default App;