// FILE: src/App.tsx
// Logica completa per gestire l'onboarding e lo stato di attivazione dell'utente.

import { useState } from "react";
import { ConnectWallet, Web3Button, useAddress, useContract, useContractRead } from "@thirdweb-dev/react";

const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302";
const emailDestinazione = "sfy.startup@gmail.com";

// Componente per il Form di Registrazione
const RegistrationForm = () => {
  const address = useAddress();
  const [formData, setFormData] = useState({
    companyName: "",
    contactEmail: "",
    sector: "",
    website: "",
    facebook: "",
    instagram: "",
    twitter: "",
    tiktok: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Controlla i campi obbligatori
    if (!formData.companyName || !formData.contactEmail || !formData.sector) {
      alert("Per favore, compila tutti i campi obbligatori.");
      return;
    }
    
    // Formatta il corpo dell'email
    const subject = `Richiesta Attivazione: ${formData.companyName}`;
    const body = `
      Una nuova azienda ha richiesto l'attivazione:
      -----------------------------------------
      Nome Azienda: ${formData.companyName}
      Email Contatto: ${formData.contactEmail}
      Settore: ${formData.sector}
      Wallet Address: ${address}
      -----------------------------------------
      Social (Opzionali):
      Sito Web: ${formData.website || "N/D"}
      Facebook: ${formData.facebook || "N/D"}
      Instagram: ${formData.instagram || "N/D"}
      Twitter: ${formData.twitter || "N/D"}
      TikTok: ${formData.tiktok || "N/D"}
    `;
    
    // Crea e apre il link mailto:
    window.location.href = `mailto:${emailDestinazione}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const settori = [
    "Agricoltura e Allevamento",
    "Alimentare e Bevande",
    "Moda e Tessile",
    "Arredamento e Design",
    "Cosmetica e Farmaceutica",
    "Artigianato",
    "Tecnologia ed Elettronica",
    "Altro"
  ];

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h2>Benvenuto su Filiera Facile!</h2>
      <p>Per attivare il tuo account compila queste informazioni:</p>
      
      <form onSubmit={handleSubmit}>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Nome della tua azienda/attività <span style={{color: 'red'}}>*</span></label>
          <input type="text" name="companyName" onChange={handleInputChange} style={inputStyle} required />
        </div>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Email di contatto <span style={{color: 'red'}}>*</span></label>
          <input type="email" name="contactEmail" onChange={handleInputChange} style={inputStyle} required />
        </div>
        <div style={formGroupStyle}>
          <label style={labelStyle}>In quale settore operi? <span style={{color: 'red'}}>*</span></label>
          <select name="sector" onChange={handleInputChange} style={inputStyle} required>
            <option value="">Seleziona un settore...</option>
            {settori.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        
        <hr style={{ margin: '2rem 0', borderColor: '#333' }} />
        
        <div style={formGroupStyle}>
          <label style={labelStyle}>Sito Web (Opzionale)</label>
          <input type="url" name="website" onChange={handleInputChange} style={inputStyle} />
        </div>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Facebook (Opzionale)</label>
          <input type="url" name="facebook" onChange={handleInputChange} style={inputStyle} />
        </div>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Instagram (Opzionale)</label>
          <input type="url" name="instagram" onChange={handleInputChange} style={inputStyle} />
        </div>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Twitter / X (Opzionale)</label>
          <input type="url" name="twitter" onChange={handleInputChange} style={inputStyle} />
        </div>
        <div style={formGroupStyle}>
          <label style={labelStyle}>TikTok (Opzionale)</label>
          <input type="url" name="tiktok" onChange={handleInputChange} style={inputStyle} />
        </div>

        <button type="submit" style={submitButtonStyle}>Invia Richiesta</button>
      </form>
    </div>
  );
};


// Componente per la Dashboard dell'Utente Attivo
const ActiveUserDashboard = () => {
  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{color: '#4caf50'}}>✅ AZIENDA ATTIVATA</h2>
      <p>Benvenuto nella tua dashboard. Ora puoi iniziare a creare le tue filiere.</p>
      {/* Qui puoi aggiungere il form per creare un nuovo batch in futuro */}
    </div>
  );
}


// Componente Principale App
export default function App() {
  const address = useAddress();
  const { contract } = useContract(contractAddress);

  // Leggiamo lo stato del contributor dal contratto
  const { data: contributorInfo, isLoading: isLoadingStatus } = useContractRead(
    contract,
    "getContributorInfo",
    [address], // Passiamo l'indirizzo dell'utente, se non c'è, la chiamata non parte
    {
      enabled: !!address, // Esegui la chiamata solo se l'utente è connesso
    }
  );

  const isContributorActive = contributorInfo?.[2] === true;

  const renderContent = () => {
    if (!address) {
      return <p style={{textAlign: 'center', marginTop: '4rem'}}>Connettiti per iniziare.</p>;
    }

    if (isLoadingStatus) {
      return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica dello stato in corso...</p>;
    }
    
    // Se l'utente è attivo, mostra la dashboard.
    if (isContributorActive) {
      return <ActiveUserDashboard />;
    } else {
      // Altrimenti, mostra il form di registrazione.
      return <RegistrationForm />;
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#121212', color: 'white', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ marginBottom: '2rem' }}>PolySupplyChain</h1>
        <ConnectWallet
          theme="dark"
          btnTitle="Connetti / Iscriviti"
        />
      </div>
      
      {renderContent()}
    </div>
  );
}

// Stili per il form
const formGroupStyle: React.CSSProperties = { marginBottom: '1rem' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.5rem', color: '#aaa' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem', backgroundColor: '#222', border: '1px solid #444', borderRadius: '5px', color: 'white', boxSizing: 'border-box' };
const submitButtonStyle: React.CSSProperties = { width: '100%', padding: '1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1rem', cursor: 'pointer', marginTop: '1rem' };
