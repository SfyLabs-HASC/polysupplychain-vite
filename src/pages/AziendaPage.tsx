// FILE: src/pages/AziendaPage.tsx
// QUESTA È LA VERSIONE FINALE E COMPLETA CHE RISOLVE L'ERRORE.

import React, { useState } from "react";
import { ConnectWallet, useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
import "../App.css"; // Assicurati di avere il file App.css con gli stili

const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302";

// === COMPONENTE 1: FORM DI REGISTRAZIONE ===
// Definizione completa del componente che mancava.
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
        throw new Error('La risposta del server non è stata positiva.');
      }

    } catch (error) {
      console.error('FAILED...', error);
      alert('❌ Si è verificato un errore. Riprova più tardi.');
    } finally {
      setIsSending(false);
    }
  };

  const settori = ["Agricoltura e Allevamento", "Alimentare e Bevande", "Moda e Tessile", "Arredamento e Design", "Cosmetica e Farmaceutica", "Artigianato", "Tecnologia ed Elettronica", "Altro"];

  return (
    <div className="card">
      <h3>Benvenuto su Easy Chain!</h3>
      <p>Per attivare il tuo account compila queste informazioni:</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group"><label htmlFor="company-name">Nome della tua azienda/attività <span style={{color: 'red'}}>*</span></label><input id="company-name" type="text" name="companyName" onChange={handleInputChange} className="form-input" required /></div>
        <div className="form-group"><label htmlFor="contact-email">Email di contatto <span style={{color: 'red'}}>*</span></label><input id="contact-email" type="email" name="contactEmail" onChange={handleInputChange} className="form-input" required /></div>
        <div className="form-group"><label htmlFor="sector">In quale settore operi? <span style={{color: 'red'}}>*</span></label><select id="sector" name="sector" onChange={handleInputChange} className="form-input" required><option value="">Seleziona un settore...</option>{settori.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        <hr style={{ margin: '2rem 0', borderColor: '#27272a' }} />
        <div className="form-group"><label htmlFor="website">Sito Web (Opzionale)</label><input id="website" type="url" name="website" onChange={handleInputChange} className="form-input" /></div>
        <div className="form-group"><label htmlFor="facebook">Facebook (Opzionale)</label><input id="facebook" type="url" name="facebook" onChange={handleInputChange} className="form-input" /></div>
        <div className="form-group"><label htmlFor="instagram">Instagram (Opzionale)</label><input id="instagram" type="url" name="instagram" onChange={handleInputChange} className="form-input" /></div>
        <div className="form-group"><label htmlFor="twitter">Twitter / X (Opzionale)</label><input id="twitter" type="url" name="twitter" onChange={handleInputChange} className="form-input" /></div>
        <div className="form-group"><label htmlFor="tiktok">TikTok (Opzionale)</label><input id="tiktok" type="url" name="tiktok" onChange={handleInputChange} className="form-input" /></div>
        <button type="submit" className="web3-button" disabled={isSending}>
          {isSending ? 'Invio in corso...' : 'Invia Richiesta'}
        </button>
      </form>
    </div>
  );
};

// === COMPONENTE 2: DASHBOARD PER L'UTENTE ATTIVO ===
// Definizione completa del componente che mancava.
const ActiveUserDashboard = () => {
    return (
        <div className="card">
            <h3 style={{color: '#34d399'}}>✅ ACCOUNT ATTIVATO</h3>
            <p>Benvenuto nella tua dashboard. Ora puoi iniziare a creare le tue filiere.</p>
            {/* Qui in futuro aggiungeremo il form per creare un batch */}
        </div>
    );
};

// === COMPONENTE PRINCIPALE DELLA PAGINA ===
export default function HomePage() {
  const address = useAddress();
  const { contract } = useContract(contractAddress);

  const { data: contributorInfo, isLoading: isLoadingStatus } = useContractRead(
    contract,
    "getContributorInfo",
    [address]
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
        <header className="header"><ConnectWallet theme="dark" btnTitle="Aziende: Accedi / Iscriviti" /></header>
        <h2 className="page-title">Portale Aziende</h2>
        {renderContent()}
      </main>
    </div>
  );
}
