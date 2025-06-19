// FILE: src/App.tsx
// VERSIONE DEFINITIVA CON LA 'G' MAIUSCOLA

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importiamo tutte le pagine
import HomePage from './pages/HomePage';
import AziendaPage from './pages/AziendaPage';
// Utilizziamo l'import con la 'G' maiuscola, come confermato
import GestisciPage from './pages/GestisciPage'; 
import './App.css';

function App() {
  return (
    // Solo le Routes, perché BrowserRouter è già in main.tsx
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<AziendaPage />} />
      <Route path="/gestisci/:batchId" element={<GestisciPage />} />
    </Routes>
  );
}

export default App;