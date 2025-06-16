// FILE: src/pages/AziendaPage.tsx
// QUESTA È LA VERSIONE STABILE PRECEDENTE (thirdweb V4) CHE FUNZIONAVA

import React, { useState, useEffect, useCallback } from "react";
import { ConnectWallet, Web3Button, useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
import { supplyChainABI as abi } from "../abi/contractABI"; // Usiamo il nostro file ABI TypeScript
import "../App.css";

// Definizione del tipo per un'azienda
type Company = {
  id: string;
  companyName: string;
  walletAddress: string;
  status: 'active' | 'pending' | 'deactivated';
  credits?: number;
  contactEmail?: string;
};

const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302";

// --- Componente: Form di Registrazione (Completo) ---
const RegistrationForm = () => {
  const address = useAddress();
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
        body: JSON.stringify({ ...formData, walletAddress: address }),
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
        <button type="submit" className="web3-button" disabled={isSending}>
          {isSending ? 'Invio in corso...' : 'Invia Richiesta di Attivazione'}
        </button>
      </form>
    </div>
  );
};


// --- Componente: Dashboard per l'Utente Attivo (Completo) ---
const ActiveUserDashboard = () => {
    // La logica per creare batch etc. andrebbe qui, per ora mostriamo solo un messaggio.
  return (
    <div className="card">
      <h3 style={{color: '#34d399'}}>✅ ACCOUNT ATTIVATO</h3>
      <p>Benvenuto nella tua dashboard. Ora puoi iniziare a creare le tue filiere.</p>
      {/* Qui potremmo aggiungere i pulsanti per inizializza, add step, etc. */}
    </div>
  );
};


// --- Componente Principale della Pagina ---
export default function AziendaPage() {
  const address = useAddress();
  const { contract } = useContract(contractAddress, abi); // Usiamo l'hook useContract con l'ABI

  // Usiamo useContractRead per leggere lo stato dell'utente
  const { data: contributorInfo, isLoading: isLoadingStatus } = useContractRead(
    contract,
    "getContributorInfo",
    [address],
    {
        // Questo hook non parte se l'indirizzo non è ancora disponibile
        enabled: !!address 
    }
  );

  const isContributorActive = contributorInfo?.[2] === true;
  const credits = contributorInfo?.[1]?.toString() || "N/A";

  const renderContent = () => {
    if (!address) {
      return <p style={{textAlign: 'center', marginTop: '4rem'}}>Connettiti per iniziare.</p>;
    }
    if (isLoadingStatus) {
      return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica dello stato dell'account...</p>;
    }
    return isContributorActive ? <ActiveUserDashboard /> : <RegistrationForm />;
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header"><h1 className="sidebar-title">Easy Chain</h1></div>
        {address && (
          <div className="user-info">
            <p><strong>Wallet Connesso:</strong></p><p style={{wordBreak: 'break-all'}}>{address}</p>
            <hr style={{ borderColor: '#27272a', margin: '1rem 0' }}/>
            <p><strong>Crediti Rimanenti:</strong></p><p>{isLoadingStatus ? "..." : credits}</p>
          </div>
        )}
      </aside>
      <main className="main-content">
        <header className="header">
          {/* Pulsante di connessione standard della V4 */}
          <ConnectWallet theme="dark"/>
        </header>
        <h2 className="page-title">Portale Aziende</h2>
        {renderContent()}
      </main>
    </div>
  );
}
