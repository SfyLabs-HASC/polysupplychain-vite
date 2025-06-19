import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// --- MODIFICA --- Ripristinati i percorsi di importazione corretti ---
// App.tsx si trova in /src, quindi per accedere alle pagine deve entrare in /pages
import AziendaPage from './pages/AziendaPage';
import GestisciPage from './pages/GestisciPage'; 
// App.css è nella stessa cartella di App.tsx, quindi il percorso è semplice
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