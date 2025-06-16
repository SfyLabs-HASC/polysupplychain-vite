// FILE: src/pages/AziendaPage.tsx
// QUESTA È LA VERSIONE FINALE E COMPLETA CHE INCLUDE TUTTE LE FUNZIONALITÀ

import React, { useState, useEffect, useCallback } from "react";
import { ConnectButton, TransactionButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, readContract, prepareContractCall } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { supplyChainABI as abi } from "../abi/contractABI";
import "../App.css";

// Definizione del tipo per un'azienda per una migliore gestione
type Company = {
  id: string;
  companyName: string;
  walletAddress: `0x${string}`;
  status: 'active' | 'pending' | 'deactivated';
  credits?: number;
  contactEmail?: string;
};

// Configurazione del Client e del Contratto
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ 
  client, 
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});


// --- Componente: Form di Registrazione (Completo) ---
const RegistrationForm = () => {
  const account = useActiveAccount();
  const [formData, setFormData] = useState({ companyName: "", contactEmail: "", sector: "", website: "", facebook: "", instagram: "", twitter: "", tiktok: "" });
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
        body: JSON.stringify({ ...formData, walletAddress: account?.address })
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
        {/* Potresti aggiungere qui gli altri campi social se vuoi */}
        <button type="submit" className="web3-button" disabled={isSending}>{isSending ? 'Invio in corso...' : 'Invia Richiesta di Attivazione'}</button>
      </form>
    </div>
  );
};


// --- Componente: Dashboard per l'Utente Attivo (Completo) ---
const ActiveUserDashboard = () => {
  return (
    <div className="card">
      <h3 style={{color: '#34d399'}}>✅ ACCOUNT ATTIVATO</h3>
      <p>Benvenuto nella tua dashboard. Clicca il pulsante per creare un batch di prova. Il gas sarà sponsorizzato da noi.</p>
      <TransactionButton
        transaction={() => prepareContractCall({
          contract,
          abi,
          method: "initializeBatch",
          params: [
            "Lotto Prova Gasless",
            "Creato con la piattaforma Easy Chain",
            new Date().toLocaleDateString(),
            "Web App",
            "ipfs://Qmb8wsGZNXt5VzNeskST5kM2p2p2j64z9u2G2K4o22V222"
          ]
        })}
        onTransactionConfirmed={() => {
          alert("✅ Batch creato con successo! La transazione è stata sponsorizzata.");
        }}
        onError={(error) => {
          alert(`❌ Errore durante la creazione del batch: ${error.message}`);
        }}
        className="web3-button"
      >
        Crea Batch di Prova
      </TransactionButton>
    </div>
  );
};


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
        return;
      }

      setIsLoading(true);
      try {
        const data = await readContract({
          contract,
          abi,
          method: "getContributorInfo",
          params: [account.address]
        });
        setIsActive(data[2]);
        setCredits(data[1].toString());
      } catch (e) {
        // Se la lettura fallisce (l'utente non è nel mapping), non è attivo.
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
    if (isLoading) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica stato...</p>;
    return isActive ? <ActiveUserDashboard /> : <RegistrationForm />;
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header"><h1 className="sidebar-title">Easy Chain</h1></div>
        {account && (
          <div className="user-info">
            <p><strong>Wallet Connesso:</strong></p>
            <p style={{wordBreak: 'break-all'}}>{account.address}</p>
            <hr style={{ borderColor: '#27272a', margin: '1rem 0' }}/>
            <p><strong>Crediti Rimanenti:</strong></p>
            <p>{isLoading ? "..." : credits}</p>
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
            appMetadata={{
              name: "Easy Chain",
              url: "https://easychain.com",
            }}
          />
        </header>
        <h2 className="page-title">Portale Aziende</h2>
        {renderContent()}
      </main>
    </div>
  );
}
