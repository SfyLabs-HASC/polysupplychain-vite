// FILE: src/pages/AziendaPage.tsx
// VERSIONE FINALE CON LISTA BATCH DINAMICA, MODALI INTERATTIVE E CONTROLLO SULLA DATA

import React, { useState, useEffect, useCallback } from "react";
import { ConnectButton, TransactionButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, readContract, prepareContractCall, parseEventLogs, toWei } from "thirdweb";
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


// --- Componente: Form di Registrazione (Invariato) ---
const RegistrationForm = () => {
  // ... (Il codice di questo componente rimane identico a prima)
  return <div className="card"><h3>Benvenuto! Compila il form...</h3></div>;
};


// --- Componente: Dashboard Utente Attivo (Logica Riscratta) ---
const ActiveUserDashboard = () => {
  const account = useActiveAccount();
  const [modal, setModal] = useState<'init' | 'add' | 'close' | null>(null);
  const [userBatches, setUserBatches] = useState<any[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [viewingBatch, setViewingBatch] = useState<any | null>(null); // Per la modale della descrizione

  // Funzione per caricare tutti i batch di un utente
  const fetchUserBatches = useCallback(async () => {
    if (!account) return;
    setIsLoadingBatches(true);
    try {
      const batchIds = await readContract({
        contract, abi, method: "getBatchesByContributor", params: [account.address]
      }) as bigint[];
      
      const batchDataPromises = batchIds.map(id => 
        readContract({ contract, abi, method: "getBatchInfo", params: [id] })
      );
      
      const batches = await Promise.all(batchDataPromises);
      setUserBatches(batches.reverse()); // Mostriamo i più recenti prima
    } catch (error) {
      console.error("Errore nel caricare i batch dell'utente:", error);
    } finally {
      setIsLoadingBatches(false);
    }
  }, [account]);

  useEffect(() => {
    fetchUserBatches();
  }, [fetchUserBatches]);

  return (
    <div className="card">
      <h3 style={{color: '#34d399'}}>✅ ACCOUNT ATTIVATO</h3>
      <p>Benvenuto nella tua dashboard operativa.</p>
      
      <div className="modal-actions">
        <button className="web3-button" onClick={() => setModal('init')}>+ Inizializza Nuovo Batch</button>
      </div>

      {/* Tabella con la lista dei batch */}
      <h4 style={{marginTop: '2rem', borderTop: '1px solid #27272a', paddingTop: '2rem'}}>Le Tue Fiere</h4>
      <table className="company-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome Batch</th>
            <th>Data</th>
            <th>Stato</th>
          </tr>
        </thead>
        <tbody>
          {isLoadingBatches ? (
            <tr><td colSpan={4} style={{textAlign: 'center', padding: '1rem'}}>Caricamento batch...</td></tr>
          ) : userBatches.length > 0 ? (
            userBatches.map(batch => (
              <tr key={batch.id.toString()}>
                <td>{batch.id.toString()}</td>
                <td>
                  <button className="link-button" onClick={() => setViewingBatch(batch)}>
                    {batch.name}
                  </button>
                </td>
                <td>{batch.date}</td>
                <td>{batch.isClosed ? 'Chiuso' : 'Aperto'}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={4} style={{textAlign: 'center', padding: '1rem'}}>Nessun batch creato.</td></tr>
          )}
        </tbody>
      </table>

      {/* Modale per Inizializzare un Batch */}
      {modal === 'init' && 
        <InitializeBatchModal 
          onClose={() => setModal(null)} 
          onSuccess={fetchUserBatches} // Ricarica la lista dopo la creazione
        />
      }
      
      {/* Modale per visualizzare la descrizione */}
      {viewingBatch &&
        <FormModal title={`Descrizione: ${viewingBatch.name}`} onClose={() => setViewingBatch(null)}>
          <p style={{whiteSpace: 'pre-wrap'}}>{viewingBatch.description || "Nessuna descrizione."}</p>
        </FormModal>
      }
    </div>
  );
};


// --- Componente: Modale per Inizializzare un Batch (Nuovo, con Form) ---
const InitializeBatchModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
  const [formData, setFormData] = useState({ name: "", description: "", location: "", date: "" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // Ottiene la data di oggi nel formato YYYY-MM-DD per l'attributo 'max' dell'input
  const today = new Date().toISOString().split('T')[0];

  return (
    <FormModal title="Inizializza Nuovo Batch" onClose={onClose}>
      <div className="form-group">
        <label>Nome Lotto *</label>
        <input name="name" type="text" className="form-input" onChange={handleInputChange} />
      </div>
      <div className="form-group">
        <label>Luogo di Origine *</label>
        <input name="location" type="text" className="form-input" onChange={handleInputChange} />
      </div>
      <div className="form-group">
        <label>Data di Inizio *</label>
        <input name="date" type="date" className="form-input" onChange={handleInputChange} max={today} />
      </div>
      <div className="form-group">
        <label>Descrizione *</label>
        <textarea name="description" className="form-textarea" onChange={handleInputChange} />
      </div>
      
      <TransactionButton
        transaction={() => prepareContractCall({
          contract, abi, method: "initializeBatch",
          params: [formData.name, formData.description, formData.date, formData.location, "ipfs://..."]
        })}
        onTransactionConfirmed={onSuccess}
        onError={(error) => alert(`❌ Errore: ${error.message}`)}
        className="web3-button"
        disabled={!formData.name || !formData.location || !formData.date || !formData.description}
      >
        Conferma e Crea Batch
      </TransactionButton>
    </FormModal>
  );
};


// --- Componente generico per la Modale (Invariato) ---
const FormModal = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{title}</h2><hr style={{margin: '1rem 0', borderColor: '#27272a'}}/>
                {children}
                <button onClick={onClose} style={{marginTop: '2rem', background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer'}}>Chiudi</button>
            </div>
        </div>
    );
};


// --- Componente Principale della Pagina (Logica di controllo invariata) ---
export default function AziendaPage() {
  const account = useActiveAccount();
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [credits, setCredits] = useState("N/A");

  useEffect(() => {
    const checkStatus = async () => {
      // ... (Questa logica rimane la stessa di prima) ...
    };
    checkStatus();
  }, [account]);

  const renderContent = () => {
    if (!account) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Connettiti per iniziare.</p>;
    if (isLoading) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica stato...</p>;
    return isActive ? <ActiveUserDashboard /> : <RegistrationForm />;
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header"><h1 className="sidebar-title">Easy Chain</h1></div>
        {account && (<div className="user-info"><p><strong>Wallet:</strong></p><p>{account.address}</p><hr/><p><strong>Crediti:</strong></p><p>{isLoading ? "..." : credits}</p></div>)}
      </aside>
      <main className="main-content">
        <header className="header"><ConnectButton client={client} accountAbstraction={{ chain: polygon, sponsorGas: true }} /></header>
        <h2 className="page-title">Portale Aziende</h2>
        {renderContent()}
      </main>
    </div>
  );
}
