// FILE: src/pages/AziendaPage.tsx
// CORRETTO: Rimossa la proprietà "wallets" non valida dal pulsante ConnectWallet.

import React, { useState } from "react";
import { ConnectWallet, useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
import "../App.css";

const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302";

// Componente per il Form di Registrazione
const RegistrationForm = () => {
    // ... il codice di questo componente rimane identico ...
};

// Componente per l'utente attivo
const ActiveUserDashboard = () => {
    // ... il codice di questo componente rimane identico ...
};

// Componente principale della pagina
export default function AziendaPage() {
  const address = useAddress();
  const { contract } = useContract(contractAddress);
  const { data: contributorInfo, isLoading: isLoadingStatus } = useContractRead(
    contract, "getContributorInfo", [address]
  );
  const isContributorActive = contributorInfo?.[2] === true;

  const renderContent = () => {
    if (!address) { return <p style={{textAlign: 'center', marginTop: '4rem'}}>Connettiti per iniziare.</p>; }
    if (isLoadingStatus) { return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica dello stato in corso...</p>; }
    if (isContributorActive) { return <ActiveUserDashboard />; } 
    else { return <RegistrationForm />; }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header"><h1 className="sidebar-title">Easy Chain</h1></div>
        {address && (
          <div className="user-info">
            <p><strong>Wallet Connesso:</strong></p><p>{address}</p>
            <hr style={{ borderColor: '#27272a', margin: '1rem 0' }}/>
            <p><strong>Crediti Rimanenti:</strong></p>
            <p>{isLoadingStatus ? "..." : contributorInfo?.[1].toString() || "N/A"}</p>
          </div>
        )}
      </aside>
      <main className="main-content">
        <header className="header">
          {/* CORREZIONE: Rimossa la proprietà "wallets" */}
          <ConnectWallet theme="dark" btnTitle="Aziende: Accedi / Iscriviti" />
        </header>
        <h2 className="page-title">Portale Aziende</h2>
        {renderContent()}
      </main>
    </div>
  );
}
