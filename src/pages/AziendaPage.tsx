// FILE: src/pages/AziendaPage.tsx
// QUESTA È LA VERSIONE FINALE, SEMPLIFICATA E CORRETTA

import React, { useState, useEffect } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, readContract } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";
import { supplyChainABI as abi } from "../abi/contractABI"; // Importiamo il nostro manuale
import "../App.css"; // Assicurati di avere questo file con gli stili

// --- 1. Configurazione del Client e del Contratto ---
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ 
  client, 
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});


// --- 2. Componente per l'Utente Attivo/Verificato ---
// Mostra solo lo stato e i crediti.
const VerifiedContent = ({ credits }: { credits: string }) => {
  return (
    <div className="card">
      <h3 style={{color: '#34d399'}}>✅ ACCOUNT ATTIVATO</h3>
      <p>Il tuo account è stato verificato e sei pronto per operare.</p>
      <div className="user-info" style={{marginTop: '1.5rem', background: '#27272a', padding: '1rem', borderRadius: '8px'}}>
        <p><strong>Crediti Rimanenti:</strong></p>
        <p style={{fontSize: '2rem', fontWeight: 'bold', margin: 0}}>{credits}</p>
      </div>
       {/* In futuro, qui aggiungeremo i pulsanti per creare i batch */}
    </div>
  );
};


// --- 3. Componente per l'Utente Non Verificato ---
// Mostra il form di registrazione.
const PendingContent = () => {
  // La logica del form di contatto andrebbe qui
  return (
    <div className="card">
        <h3>Benvenuto su Easy Chain!</h3>
        <p>Il tuo account non è ancora attivo. Per procedere, invia una richiesta di attivazione al nostro team.</p>
        {/* Qui andrebbe il tuo form di contatto completo */}
        <button className="web3-button" onClick={() => alert("Funzionalità di registrazione da implementare.")}>
          Richiedi Attivazione
        </button>
    </div>
  );
};


// --- 4. Componente Principale della Pagina ---
export default function AziendaPage() {
  // Otteniamo l'account attivo
  const account = useActiveAccount();

  // Stati per gestire la logica della pagina
  const [isVerified, setIsVerified] = useState(false);
  const [credits, setCredits] = useState("0");
  const [isLoading, setIsLoading] = useState(true);

  // Questo "effetto" parte ogni volta che l'utente si connette o si disconnette
  useEffect(() => {
    // Funzione interna per controllare lo stato on-chain
    const checkStatus = async () => {
      // Se non c'è un account connesso, non facciamo nulla.
      if (!account) {
        setIsLoading(false);
        setIsVerified(false);
        return;
      }

      setIsLoading(true);
      console.log("DEBUG: Controllo stato per l'account:", account.address);

      try {
        // Chiamiamo il contratto usando la sintassi corretta e completa
        const data = await readContract({
          contract,
          abi,
          method: "getContributorInfo",
          params: [account.address]
        }) as [string, bigint, boolean];
        
        // La risposta è un array: [nome, crediti, èAttivo]
        const contributorIsActive = data[2];
        const contributorCredits = data[1].toString();
        
        console.log(`DEBUG: Stato ricevuto: Attivo=${contributorIsActive}, Crediti=${contributorCredits}`);

        // Aggiorniamo lo stato della nostra pagina
        setIsVerified(contributorIsActive);
        setCredits(contributorCredits);

      } catch (e) {
        // Questo errore è normale se l'utente non è mai stato registrato.
        // Significa che non è verificato.
        console.log("Utente non trovato nel contratto, non è ancora un contributor.");
        setIsVerified(false);
        setCredits("0");
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [account]); // Questa funzione si riattiva ogni volta che l'account cambia


  // Logica per decidere cosa mostrare a schermo
  const renderContent = () => {
    // Se non c'è un account, mostra un messaggio di invito
    if (!account) {
      return <p style={{textAlign: 'center', marginTop: '4rem'}}>Connettiti per accedere al portale.</p>;
    }
    // Se stiamo caricando i dati, mostra un messaggio di attesa
    if (isLoading) {
      return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica dello stato dell'account...</p>;
    }
    // Se il caricamento è finito, mostra il componente giusto in base allo stato
    return isVerified ? <VerifiedContent credits={credits} /> : <PendingContent />;
  };


  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header"><h1 className="sidebar-title">Easy Chain</h1></div>
        {account && (
          <div className="user-info">
            <p><strong>Wallet Connesso:</strong></p>
            <p style={{wordBreak: 'break-all'}}>{account.address}</p>
          </div>
        )}
      </aside>
      <main className="main-content">
        <header className="header">
          <ConnectButton
            client={client}
            accountAbstraction={{
              chain: polygon,
              sponsorGas: true,
            }}
          />
        </header>
        <h2 className="page-title">Portale Aziende</h2>
        {renderContent()}
      </main>
    </div>
  );
}
