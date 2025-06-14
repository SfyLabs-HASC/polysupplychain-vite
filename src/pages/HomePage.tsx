// FILE: src/pages/HomePage.tsx
// Questa è la nuova pagina di presentazione del servizio.

import { Link } from "react-router-dom";
import "../App.css"; // Usiamo gli stessi stili

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
          {/* Questo è un link che porta alla pagina di login/registrazione delle aziende */}
          <Link to="/azienda">
            <button className="web3-button">
              ISCRIVITI / ACCEDI
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
