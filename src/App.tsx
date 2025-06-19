import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AziendaPage from './pages/AziendaPage';
import GestisciPage from './pages/GestisciPage'; // La nuova pagina che creeremo
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