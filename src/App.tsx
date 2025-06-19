import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// --- MODIFICA --- I percorsi sono stati corretti ---
// Visto che App.tsx è in /pages, non serve più specificare la cartella.
import AziendaPage from './AziendaPage';
import GestisciPage from './GestisciPage'; 
// Anche il percorso del CSS va aggiornato per "salire" di una cartella
import '../App.css';

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