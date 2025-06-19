import React from 'react';
// Nota: non importiamo più BrowserRouter qui
import { Routes, Route } from 'react-router-dom';

// I percorsi corretti basati sulla tua struttura
import AziendaPage from './pages/AziendaPage';
import GestisciPage from './pages/GestisciPage'; 
import './App.css';

function App() {
  return (
    // Il contenitore <BrowserRouter> è stato rimosso da qui, perché è già in main.tsx
    <Routes>
      <Route path="/" element={<AziendaPage />} />
      <Route path="/gestisci/:batchId" element={<GestisciPage />} />
    </Routes>
  );
}

export default App;