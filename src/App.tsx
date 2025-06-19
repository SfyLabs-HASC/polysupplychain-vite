import React from 'react';
import { Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage';       // La pagina di benvenuto
import AziendaPage from './pages/AziendaPage';     // La dashboard privata
import GestisciPage from './pages/gestisciPage'; // La pagina di gestione
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<AziendaPage />} />
      <Route path="/gestisci/:batchId" element={<GestisciPage />} />
    </Routes>
  );
}

export default App;