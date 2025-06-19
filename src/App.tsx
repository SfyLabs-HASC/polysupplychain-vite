import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importiamo tutte le pagine necessarie
import HomePage from './pages/HomePage'; // La vera Home Page
import AziendaPage from './pages/AziendaPage'; // La dashboard dell'azienda
import GestisciPage from './pages/GestisciPage'; 
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* La rotta "/" ora punta alla HomePage */}
        <Route path="/" element={<HomePage />} />
        
        {/* La dashboard dell'azienda ora ha il suo percorso dedicato */}
        <Route path="/dashboard" element={<AziendaPage />} />

        {/* La pagina di gestione rimane invariata */}
        <Route path="/gestisci/:batchId" element={<GestisciPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;