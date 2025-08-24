import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import Entradas from "./pages/Entradas";
import Salidas from "./pages/Salidas";
import Estadisticas from "./pages/Estadisticas";
import Inventario from "./pages/Inventario";
import Registros from "./pages/Registros";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/Inventario" replace />} />
          <Route path="/entradas" element={<Entradas />} />
          <Route path="/salidas" element={<Salidas />} />
          <Route path="/estadisticas" element={<Estadisticas />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/registros" element={<Registros />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;