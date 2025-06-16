import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AziendaPage from "./pages/AziendaPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/azienda" element={<AziendaPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}
