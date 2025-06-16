// FILE: src/App.tsx
// Gestisce la navigazione tra le diverse pagine del sito.

import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AziendaPage from "./pages/AziendaPage";
import AdminPage from "./pages/AdminPage";
import "./App.css"; // Importiamo gli stili globali qui

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/azienda" element={<AziendaPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}
