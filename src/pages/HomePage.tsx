// ========================================================================
// FILE: src/pages/HomePage.tsx
// SCOPO: Pagina di benvenuto statica con i link alle altre sezioni.
// ========================================================================

import { Link } from "react-router-dom";
import "../App.css";

export default function HomePage() {
  return (
    <div className="app-container">
      <main className="main-content" style={{ textAlign: 'center', margin: 'auto' }}>
        <h1 className="page-title" style={{ fontSize: '3rem' }}>
          Benvenuto su Easy Chain
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#a0a0a0', maxWidth: '600px', margin: '1rem auto' }}>
          La soluzione semplice e sicura per certificare la tua filiera produttiva su blockchain, 
          garantendo trasparenza e valore ai tuoi prodotti.
        </p>
        
        <div style={{ marginTop: '3rem' }}>
          <Link to="/azienda">
            <button className="web3-button">
              ISCRIVITI / ACCEDI
            </button>
          </Link>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <Link to="/admin" style={{color: '#a0a0a0', fontSize: '0.9rem'}}>
            Accesso Amministratore
          </Link>
        </div>
      </main>
    </div>
  );
}
