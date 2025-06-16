// FILE: src/pages/AziendaPage.tsx
// Versione finale per testare le transazioni gasless con Account Abstraction.

import React, { useState } from "react";
import { ConnectButton, TransactionButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, prepareContractCall, parseEventLogs } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { abi } from "../abi/SupplyChainV2.json";
import "../App.css";

// --- Configurazione del Client e del Contratto ---
const client = createThirdwebClient({
  clientId: "e40dfd747fabedf48c5837fb79caf2eb"
});

const contract = getContract({ 
  client, 
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});


// --- Componente: La Dashboard Operativa ---
const ActiveUserDashboard = () => {
  // Stato per memorizzare l'ID dell'ultimo batch creato
  const [lastBatchId, setLastBatchId] = useState<bigint | null>(null);
  const [stepCounter, setStepCounter] = useState(0);

  return (
    <div className="card">
      <h3 style={{color: '#34d399'}}>✅ ACCOUNT ATTIVATO</h3>
      <p>Questa è la tua dashboard di test per le transazioni senza gas.</p>
      
      {/* Mostra l'ID dell'ultimo batch creato */}
      {lastBatchId !== null && (
        <div style={{ background: '#27272a', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <p style={{margin: 0}}>Ultimo Batch creato con ID: <strong>{lastBatchId.toString()}</strong></p>
        </div>
      )}

      <div className="modal-actions" style={{ flexDirection: 'column' }}>
        
        {/* 1. PULSANTE PER INIZIALIZZARE IL BATCH */}
        <TransactionButton
          transaction={() => {
            setStepCounter(0); // Resetta il contatore di step
            return prepareContractCall({
              contract,
              method: "initializeBatch",
              params: [
                `Lotto Prova Gasless #${Math.floor(Math.random() * 1000)}`,
                "Creato per testare Account Abstraction.",
                new Date().toLocaleDateString(),
                "Web App V5",
                "ipfs://Qmb8wsGZNXt5VzNeskST5kM2p2p2j64z9u2G2K4o22V222"
              ]
            });
          }}
          onTransactionConfirmed={(receipt) => {
            // Dopo che la transazione è confermata, cerchiamo l'evento per ottenere il nuovo ID
            try {
              const events = parseEventLogs({
                logs: receipt.logs,
                abi: abi,
                eventName: "BatchInitialized"
              });
              const newBatchId = events[0].args.batchId;
              setLastBatchId(newBatchId);
              alert(`✅ Batch Inizializzato! Nuovo ID: ${newBatchId}`);
            } catch (e) {
              console.error("Errore nel parsing dell'evento", e);
              alert("✅ Batch creato, ma non è stato possibile recuperare il nuovo ID.");
            }
          }}
          onError={(error) => alert(`❌ Errore: ${error.message}`)}
          className="web3-button"
        >
          1. Inizializza Nuovo Batch
        </TransactionButton>

        {/* 2. PULSANTE PER AGGIUNGERE UNO STEP */}
        <TransactionButton
          transaction={() => {
            const currentStep = stepCounter + 1;
            setStepCounter(currentStep); // Incrementa il contatore
            return prepareContractCall({
              contract,
              method: "addStepToBatch",
              params: [
                lastBatchId, // Usa l'ID salvato
                `Passaggio di Prova #${currentStep}`,
                "Aggiunto step tramite transazione sponsorizzata.",
                new Date().toLocaleDateString(),
                "Laboratorio",
                "ipfs://..."
              ]
            });
          }}
          onTransactionConfirmed={() => alert(`✅ Step #${stepCounter + 1} aggiunto al batch ${lastBatchId}!`)}
          onError={(error) => alert(`❌ Errore: ${error.message}`)}
          className="web3-button"
          // Il pulsante è disabilitato se non abbiamo ancora creato un batch
          disabled={lastBatchId === null} 
        >
          2. Aggiungi Step
        </TransactionButton>

        {/* 3. PULSANTE PER CHIUDERE IL BATCH */}
        <TransactionButton
          transaction={() => prepareContractCall({
            contract,
            method: "closeBatch",
            params: [lastBatchId] // Usa l'ID salvato
          })}
          onTransactionConfirmed={() => {
            alert(`✅ Batch ${lastBatchId} chiuso con successo!`);
            setLastBatchId(null); // Resetta l'ID dopo la chiusura
          }}
          onError={(error) => alert(`❌ Errore: ${error.message}`)}
          className="web3-button" style={{backgroundColor: '#ef4444'}}
          // Il pulsante è disabilitato se non abbiamo un batch aperto
          disabled={lastBatchId === null}
        >
          3. Chiudi Batch
        </TransactionButton>

      </div>
    </div>
  );
};


// --- Componente Principale della Pagina ---
export default function AziendaPage() {
  const account = useActiveAccount();
  
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header"><h1 className="sidebar-title">Easy Chain</h1></div>
        {account && (<div className="user-info"><p><strong>Wallet Connesso:</strong></p><p>{account.address}</p></div>)}
      </aside>
      <main className="main-content">
        <header className="header">
          {/* Pulsante di connessione con Account Abstraction abilitato */}
          <ConnectButton
            client={client}
            accountAbstraction={{
              chain: polygon,
              sponsorGas: true,
            }}
          />
        </header>
        <h2 className="page-title">Test Account Abstraction</h2>
        
        {/* Mostriamo la dashboard solo se l'utente è connesso */}
        {account ? (
          <ActiveUserDashboard />
        ) : (
          <p style={{textAlign: 'center', marginTop: '4rem'}}>Connettiti con un account social per testare le transazioni senza gas.</p>
        )}
      </main>
    </div>
  );
}
