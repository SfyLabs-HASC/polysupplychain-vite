// FILE: src/App.tsx
// VERSIONE CHE UTILIZZA L'IMPORT CORRETTO CON LA 'G' MAIUSCOLA

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importa i componenti delle pagine dalla loro cartella
import AziendaPage from './pages/AziendaPage';
import GestisciPage from './pages/GestisciPage'; // Utilizza 'GestisciPage' con la G maiuscola
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AziendaPage />} />
        <Route path="/gestisci/:batchId" element={<GestisciPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;