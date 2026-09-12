import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FarmerList from "./pages/farmers/FarmerList";
import FarmerForm from "./pages/farmers/FarmerForm";
import FarmerDetails from "./pages/farmers/FarmerDetails";
import PlantationList from "./pages/plantations/PlantationList";
import PlantationForm from "./pages/plantations/PlantationForm";
import PlantationDetails from "./pages/plantations/PlantationDetails";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          <Route path="/farmers" element={<ProtectedRoute><FarmerList /></ProtectedRoute>} />
          <Route path="/farmers/new" element={<ProtectedRoute><FarmerForm /></ProtectedRoute>} />
          <Route path="/farmers/:id" element={<ProtectedRoute><FarmerDetails /></ProtectedRoute>} />
          <Route path="/farmers/:id/edit" element={<ProtectedRoute><FarmerForm /></ProtectedRoute>} />

          <Route path="/plantations" element={<ProtectedRoute><PlantationList /></ProtectedRoute>} />
          <Route path="/plantations/new" element={<ProtectedRoute><PlantationForm /></ProtectedRoute>} />
          <Route path="/plantations/:id" element={<ProtectedRoute><PlantationDetails /></ProtectedRoute>} />
          <Route path="/plantations/:id/edit" element={<ProtectedRoute><PlantationForm /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
