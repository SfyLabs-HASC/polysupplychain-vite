// ========================================================================
// FILE: src/pages/AziendaPage.tsx
// SCOPO: Portale per le aziende, con form di registrazione o dashboard.
// ========================================================================

import React, { useState } from "react";
import { useAccount, useReadContract } from 'wagmi';
import { KitConnectButton } from '@0xsequence/kit';
import { abi } from '../abi/SupplyChainV2.json';
import "../App.css";

const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302" as const;

// --- Componente: Form di Registrazione ---
const RegistrationForm = () => {
  const { address } = useAccount();
  const [formData, setFormData] = useState({ companyName: "", contactEmail: "", sector: "", website: "" });
  const [isSending, setIsSending] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.contactEmail || !formData.sector) { alert("Per favore, compila tutti i campi obbligatori."); return; }
    setIsSending(true);
    try {
      const response = await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, walletAddress: address }) });
      if (response.ok) { alert('✅ Richiesta inviata con successo! Verrai contattato a breve.'); } else { throw new Error('Errore del server.'); }
    } catch (error) { alert('❌ Si è verificato un errore.'); } finally { setIsSending(false); }
  };

  const settori = ["Agricoltura e Allevamento", "Alimentare e Bevande", "Moda e Tessile", "Arredamento e Design", "Cosmetica e Farmaceutica", "Artigianato", "Tecnologia ed Elettronica", "Altro"];
  
  return (
    <div className="card">
      <h3>Benvenuto su Easy Chain!</h3>
      <p>Per attivare il tuo account compila queste informazioni:</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group"><label htmlFor="company-name">Nome azienda <span style={{color: 'red'}}>*</span></label><input id="company-name" type="text" name="companyName" onChange={handleInputChange} className="form-input" required /></div>
        <div className="form-group"><label htmlFor="contact-email">Email contatto <span style={{color: 'red'}}>*</span></label><input id="contact-email" type="email" name="contactEmail" onChange={handleInputChange} className="form-input" required /></div>
        <div className="form-group"><label htmlFor="sector">Settore <span style={{color: 'red'}}>*</span></label><select id="sector" name="sector" onChange={handleInputChange} className="form-input" required><option value="">Seleziona...</option>{settori.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        <hr style={{ margin: '2rem 0', borderColor: '#27272a' }} />
        <div className="form-group"><label htmlFor="website">Sito Web (Opzionale)</label><input id="website" type="url" name="website" onChange={handleInputChange} className="form-input" /></div>
        <button type="submit" className="web3-button" disabled={isSending}>{isSending ? 'Invio...' : 'Invia Richiesta'}</button>
      </form>
    </div>
  );
};

// --- Componente: Dashboard per l'Utente Attivo ---
const ActiveUserDashboard = () => (
  <div className="card">
    <h3 style={{color: '#34d399'}}>✅ ACCOUNT ATTIVATO</h3>
    <p>Benvenuto nella tua dashboard. Ora puoi iniziare a creare le tue filiere.</p>
  </div>
);

// --- Componente Principale della Pagina Aziende ---
export default function AziendaPage() {
  const { address, isConnected } = useAccount();

  const { data: contributorInfo, isLoading: isLoadingStatus } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'getContributorInfo',
    args: [address],
    query: { enabled: isConnected }
  });

  const isContributorActive = (contributorInfo as any)?.[2] === true;

  const renderContent = () => {
    if (!isConnected) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Connettiti per iniziare.</p>;
    if (isLoadingStatus) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica stato...</p>;
    return isContributorActive ? <ActiveUserDashboard /> : <RegistrationForm />;
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header"><h1 className="sidebar-title">Easy Chain</h1></div>
        {isConnected && (<div className="user-info"><p><strong>Wallet Connesso:</strong></p><p>{address}</p><hr style={{ borderColor: '#27272a', margin: '1rem 0' }}/><p><strong>Crediti:</strong></p><p>{isLoadingStatus ? "..." : (contributorInfo as any)?.[1]?.toString() || "N/A"}</p></div>)}
      </aside>
      <main className="main-content">
        <header className="header"><KitConnectButton /></header>
        <h2 className="page-title">Portale Aziende</h2>
        {renderContent()}
      </main>
    </div>
  );
}
