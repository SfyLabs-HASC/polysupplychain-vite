import React from 'react';
// Nota: NON importiamo più BrowserRouter qui
import { Routes, Route } from 'react-router-dom';

// Importiamo tutte le pagine necessarie
import HomePage from './pages/HomePage';
import AziendaPage from './pages/AziendaPage';
// Uso la 'g' minuscola perché sappiamo che su GitHub il file si chiama così
import GestisciPage from './pages/gestisciPage'; 
import './App.css';

function App() {
  return (
    // NESSUN <BrowserRouter> qui intorno. Solo le <Routes>.
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<AziendaPage />} />
      <Route path="/gestisci/:batchId" element={<GestisciPage />} />
    </Routes>
  );
}

export default App;