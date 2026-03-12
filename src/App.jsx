// App.jsx - il router principale di Liftly.
// Per ora abbiamo solo Login e Register, ma la struttura e' pronta
// per aggiungere le altre pagine man mano che le sviluppiamo.

import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Qualsiasi rotta sconosciuta -> login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
