// FILE: src/pages/AziendaPage.tsx
// QUESTA È LA VERSIONE FINALE E COMPLETA CHE INCLUDE TUTTE LE FUNZIONALITÀ CORRETTE

import React, { useState, useEffect, useCallback } from "react";
import { ConnectButton, TransactionButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, readContract, prepareContractCall, parseEventLogs } from "thirdweb";
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


// --- Componente: Form di Registrazione (Completo) ---
const RegistrationForm = () => {
  const account = useActiveAccount();
  const [formData, setFormData] = useState({
    companyName: "", contactEmail: "", sector: "", website: "",
    facebook: "", instagram: "", twitter: "", tiktok: "",
  });
  const [isSending, setIsSending] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.contactEmail || !formData.sector) {
      alert("Per favore, compila tutti i campi obbligatori.");
      return;
    }
    setIsSending(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, walletAddress: account?.address }),
      });
      if (response.ok) {
        alert('✅ Richiesta inviata con successo! Verrai contattato a breve.');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore del server.');
      }
    } catch (error) {
      alert(`❌ Si è verificato un errore: ${(error as Error).message}`);
    } finally {
      setIsSending(false);
    }
  };

  const settori = ["Agricoltura e Allevamento", "Alimentare e Bevande", "Moda e Tessile", "Arredamento e Design", "Cosmetica e Farmaceutica", "Artigianato", "Tecnologia ed Elettronica", "Altro"];

  return (
    <div className="card">
      <h3>Benvenuto su Easy Chain!</h3>
      <p>Il tuo account non è ancora attivo. Compila queste informazioni per inviare una richiesta di attivazione al nostro team.</p>
      <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
        <div className="form-group"><label>Nome azienda <span style={{color: 'red'}}>*</span></label><input type="text" name="companyName" onChange={handleInputChange} className="form-input" required /></div>
        <div className="form-group"><label>Email contatto <span style={{color: 'red'}}>*</span></label><input type="email" name="contactEmail" onChange={handleInputChange} className="form-input" required /></div>
        <div className="form-group"><label>Settore <span style={{color: 'red'}}>*</span></label><select name="sector" onChange={handleInputChange} className="form-input" required><option value="">Seleziona...</option>{settori.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        <hr style={{ margin: '2rem 0', borderColor: '#27272a' }} />
        <div className="form-group"><label>Sito Web (Opzionale)</label><input type="url" name="website" onChange={handleInputChange} className="form-input" /></div>
        <div className="form-group"><label>Facebook (Opzionale)</label><input type="url" name="facebook" onChange={handleInputChange} className="form-input" /></div>
        <div className="form-group"><label>Instagram (Opzionale)</label><input type="url" name="instagram" onChange={handleInputChange} className="form-input" /></div>
        <div className="form-group"><label>Twitter / X (Opzionale)</label><input type="url" name="twitter" onChange={handleInputChange} className="form-input" /></div>
        <div className="form-group"><label>TikTok (Opzionale)</label><input type="url" name="tiktok" onChange={handleInputChange} className="form-input" /></div>
        <button type="submit" className="web3-button" disabled={isSending}>
          {isSending ? 'Invio in corso...' : 'Invia Richiesta di Attivazione'}
        </button>
      </form>
    </div>
  );
};


// --- Componente: Dashboard per l'Utente Attivo (con le modali) ---
const ActiveUserDashboard = () => {
  const [modal, setModal] = useState<'init' | 'add' | 'close' | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<bigint | null>(null);

  const handleTransactionSuccess = (receipt: any, type: 'init' | 'add' | 'close') => {
    setModal(null);
    if (type === 'init') {
      try {
        const events = parseEventLogs({ logs: receipt.logs, abi, eventName: "BatchInitialized" });
        const newBatchId = events[0].args.batchId;
        setActiveBatchId(newBatchId);
        alert(`✅ Batch Inizializzato! Nuovo ID: ${newBatchId}`);
      } catch (e) {
        alert("✅ Batch creato, ma non è stato possibile recuperare il nuovo ID.");
      }
    } else if (type === 'add') {
      alert(`✅ Step aggiunto al batch ${activeBatchId}!`);
    } else if (type === 'close') {
      alert(`✅ Batch ${activeBatchId} chiuso con successo!`);
      setActiveBatchId(null);
    }
  };
  
  return (
    <div className="card">
      <h3 style={{color: '#34d399'}}>✅ ACCOUNT ATTIVATO</h3>
      <p>Benvenuto nella tua dashboard. Le seguenti azioni sono sponsorizzate (gasless).</p>
      
      {activeBatchId && <div style={{background: '#27272a', padding: '1rem', borderRadius: '8px', margin: '1rem 0'}}><p style={{margin:0}}>Stai lavorando sul Batch ID: <strong>{activeBatchId.toString()}</strong></p></div>}

      <div className="modal-actions">
        <button className="web3-button" onClick={() => setModal('init')}>1. Inizializza Batch</button>
        <button className="web3-button" onClick={() => setModal('add')} disabled={!activeBatchId}>2. Aggiungi Step</button>
        <button className="web3-button" onClick={() => setModal('close')} disabled={!activeBatchId} style={{backgroundColor: '#ef4444'}}>3. Chiudi Batch</button>
      </div>

      {modal === 'init' && 
        <FormModal title="Inizializza Nuovo Batch" onClose={() => setModal(null)}>
          <p>Stai per creare un nuovo batch. I dati sono pre-compilati per questo test.</p>
          <TransactionButton
            transaction={() => prepareContractCall({
              contract, abi, method: "initializeBatch",
              params: [ "Lotto Prova Gasless", "Descrizione di prova", new Date().toLocaleDateString(), "Web App", "ipfs://..."]
            })}
            onTransactionConfirmed={(receipt) => handleTransactionSuccess(receipt, 'init')}
            onError={(error) => alert(`❌ Errore: ${error.message}`)}
            className="web3-button"
          >
            Conferma Inizializzazione
          </TransactionButton>
        </FormModal>
      }
      {modal === 'add' && activeBatchId &&
        <FormModal title={`Aggiungi Step al Batch #${activeBatchId.toString()}`} onClose={() => setModal(null)}>
           <p>Stai per aggiungere uno step al batch corrente.</p>
           <TransactionButton
            transaction={() => prepareContractCall({
              contract, abi, method: "addStepToBatch",
              params: [ activeBatchId, "Nuovo Step", "Dettagli...", new Date().toLocaleDateString(), "Luogo...", "ipfs://..."]
            })}
            onTransactionConfirmed={(receipt) => handleTransactionSuccess(receipt, 'add')}
            onError={(error) => alert(`❌ Errore: ${error.message}`)}
            className="web3-button"
          >
            Conferma Aggiunta Step
          </TransactionButton>
        </FormModal>
      }
      {modal === 'close' && activeBatchId &&
        <FormModal title={`Chiudi Batch #${activeBatchId.toString()}`} onClose={() => setModal(null)}>
           <p>Sei sicuro di voler chiudere questo batch? L'azione è irreversibile e consumerà 1 credito.</p>
           <TransactionButton
            transaction={() => prepareContractCall({ contract, abi, method: "closeBatch", params: [activeBatchId] })}
            onTransactionConfirmed={(receipt) => handleTransactionSuccess(receipt, 'close')}
            onError={(error) => alert(`❌ Errore: ${error.message}`)}
            className="web3-button" style={{backgroundColor: '#ef4444'}}
          >
            Conferma Chiusura
          </TransactionButton>
        </FormModal>
      }
    </div>
  );
};


// --- Componente generico per la Modale ---
const FormModal = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{title}</h2>
                <hr style={{margin: '1rem 0', borderColor: '#27272a'}}/>
                {children}
                <button onClick={onClose} style={{marginTop: '2rem', background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer'}}>Annulla</button>
            </div>
        </div>
    )
}

// --- Componente Principale della Pagina ---
export default function AziendaPage() {
  const account = useActiveAccount();
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [credits, setCredits] = useState("N/A");

  useEffect(() => {
    const checkStatus = async () => {
      if (!account) {
        setIsLoading(false);
        setIsActive(false);
        setCredits("N/A");
        return;
      }

      setIsLoading(true);
      try {
        // CORREZIONE DEFINITIVA: Usiamo la sintassi semplice e interpretiamo la risposta come un array.
        const data = await readContract({
          contract,
          abi,
          method: "getContributorInfo",
          params: [account.address]
        }) as [string, bigint, boolean];
        
        // Accediamo ai dati con gli indici dell'array:
        // data[0] è il nome (string)
        // data[1] sono i crediti (bigint)
        // data[2] è lo stato di attivazione (boolean)
        const contributorIsActive = data[2];
        const contributorCredits = data[1].toString();

        setIsActive(contributorIsActive);
        setCredits(contributorCredits);

      } catch (e) {
        // Questo errore è normale se l'utente non è ancora stato registrato.
        setIsActive(false);
        setCredits("N/A");
      } finally {
        setIsLoading(false);
      }
    };
    checkStatus();
  }, [account]);

  const renderContent = () => {
    if (!account) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Connettiti per iniziare.</p>;
    if (isLoading) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica dello stato dell'account...</p>;
    return isActive ? <ActiveUserDashboard /> : <RegistrationForm />;
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header"><h1 className="sidebar-title">Easy Chain</h1></div>
        {account && (
          <div className="user-info">
            <p><strong>Wallet Connesso:</strong></p><p style={{wordBreak: 'break-all'}}>{account.address}</p>
            <hr style={{ borderColor: '#27272a', margin: '1rem 0' }}/>
            <p><strong>Crediti Rimanenti:</strong></p><p>{isLoading ? "..." : credits}</p>
          </div>
        )}
      </aside>
      <main className="main-content">
        <header className="header">
          <ConnectButton
            client={client}
            wallets={[inAppWallet()]}
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
