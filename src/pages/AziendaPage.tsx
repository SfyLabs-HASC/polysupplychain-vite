// FILE: src/pages/AziendaPage.tsx
// QUESTA È LA VERSIONE SEMPLIFICATA E CORRETTA PER TESTARE IL CONTROLLO ON-CHAIN

import React, { useState, useEffect } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, readContract } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";
import { supplyChainABI as abi } from "../abi/contractABI";
import "../App.css";

// --- Configurazione del Client e del Contratto ---
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ 
  client, 
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});


// --- Componente Principale della Pagina ---
export default function AziendaPage() {
  const account = useActiveAccount();
  const [statusMessage, setStatusMessage] = useState("Per favore, connettiti per verificare il tuo stato.");
  const [isLoading, setIsLoading] = useState(false);

  // Questo "effetto" parte ogni volta che l'utente si connette o si disconnette
  useEffect(() => {
    // Funzione interna per controllare lo stato on-chain
    const checkStatus = async () => {
      // Se non c'è un account connesso, resetta tutto e fermati.
      if (!account) {
        setStatusMessage("Per favore, connettiti per verificare il tuo stato.");
        return;
      }

      setIsLoading(true);
      setStatusMessage("Verifica in corso sulla blockchain...");

      try {
        // Chiamiamo il contratto usando la sintassi corretta.
        const data = await readContract({
          contract,
          abi,
          method: "getContributorInfo",
          params: [account.address]
        }) as [string, bigint, boolean];
        
        // La risposta è un array: [nome, crediti, èAttivo]
        const contributorIsActive = data[2];
        const contributorCredits = data[1].toString();

        // Mostriamo il messaggio corretto in base al risultato
        if (contributorIsActive) {
          setStatusMessage(`✅ Sei un contributor ATTIVO con ${contributorCredits} crediti.`);
        } else {
          // Questo caso si verifica se sei nel contratto ma sei stato disattivato
          setStatusMessage(`❌ Il tuo account è registrato ma NON è attivo. Contatta l'amministratore.`);
        }

      } catch (e) {
        // Questo errore è NORMALE e ATTESO se un utente nuovo si connette.
        // Significa che la funzione `getContributorInfo` non lo ha trovato.
        console.error("DEBUG: Errore lettura contratto (probabilmente utente non registrato):", e);
        setStatusMessage(`⏳ Non sei ancora registrato come contributor. Invia una richiesta di attivazione.`);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [account]); // Questa funzione si riattiva ogni volta che l'account cambia


  return (
    <div className="app-container">
      <main className="main-content" style={{width: '100%', padding: '2rem 4rem'}}>
        <header className="header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 className="page-title">Portale Aziende</h1>
            <ConnectButton
              client={client}
              wallets={[inAppWallet()]}
              accountAbstraction={{
                chain: polygon,
                sponsorGas: true,
              }}
            />
        </header>
        
        <div className="card" style={{marginTop: '4rem', textAlign: 'center'}}>
            <h2>Stato del Tuo Account</h2>
            <div style={{marginTop: '2rem', fontSize: '1.2rem', padding: '2rem', border: '1px solid #333', borderRadius: '8px', minHeight: '60px'}}>
              <p>{isLoading ? "Caricamento..." : statusMessage}</p>
            </div>
        </div>
      </main>
    </div>
  );
}
