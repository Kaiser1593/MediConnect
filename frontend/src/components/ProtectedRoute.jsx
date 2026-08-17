// src/components/ProtectedRoute.jsx
// Bloque l'accès à une route selon la connexion et le rôle.
//
// Usage :
//   <ProtectedRoute allowedRoles={["patient"]}>
//     <PatientDashboard />
//   </ProtectedRoute>

import { Navigate, useLocation } from "react-router-dom";

import useAuth from "../hooks/useAuth";

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Tant que la session est en cours de vérification, on n'affiche rien
  // et surtout on ne redirige pas.
  if (isLoading) {
    return <p className="route-loading">Chargement…</p>;
  }

  if (!isAuthenticated) {
    // state={{ from }} permet de renvoyer l'utilisateur là où il voulait
    // aller, une fois connecté.
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  // Un patient qui tente d'ouvrir /admin/dashboard est renvoyé
  // vers son propre espace, pas vers la page de connexion.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const homeByRole = {
      patient: "/patient/dashboard",
      doctor: "/doctor/dashboard",
      admin: "/admin/dashboard",
    };

    return <Navigate to={homeByRole[user.role] || "/"} replace />;
  }

  return children;
}

export default ProtectedRoute;
