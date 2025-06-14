// FILE: src/pages/AziendaPage.tsx
// AGGIORNATO: Ora il login è limitato SOLO ai social.

import React, { useState } from "react";
import { ConnectWallet, useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
import { inAppWallet } from "@thirdweb-dev/react"; // Importiamo solo il wallet che ci serve
import "../App.css";

const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302";

// ... i componenti RegistrationForm e ActiveUserDashboard rimangono identici ...
// (Per brevità, non li riporto, ma devono essere presenti in questo file)

// Componente principale della pagina
export default function AziendaPage() {
  const address = useAddress();
  const { contract } = useContract(contractAddress);

  // ... la logica di renderContent, ecc. rimane identica a prima ...

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header"><h1 className="sidebar-title">Easy Chain</h1></div>
        {/* ... resto della sidebar ... */}
      </aside>
      <main className="main-content">
        <header className="header">
          {/* MODIFICA CHIAVE: Limitiamo le opzioni di login solo ai social */}
          <ConnectWallet 
            theme="dark" 
            btnTitle="Accedi / Iscriviti"
            wallets={[inAppWallet()]} // <-- Questa proprietà limita le opzioni
          />
        </header>
        <h2 className="page-title">Portale Aziende</h2>
        {/* ... Il resto della tua interfaccia utente (renderContent) ... */}
      </main>
    </div>
  );
}

// Assicurati di copiare e incollare qui sotto i componenti completi
// RegistrationForm e ActiveUserDashboard dal nostro codice precedente!
