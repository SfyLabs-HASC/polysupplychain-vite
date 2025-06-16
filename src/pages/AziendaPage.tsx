// FILE: src/pages/AziendaPage.tsx
// Versione finale con login SOLO social, account abstraction, e sintassi V5 corretta.

import React, { useState, useEffect, useCallback } from "react";
import { ConnectButton, TransactionButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, readContract, prepareContractCall } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets"; // Importazione corretta per V5
import { supplyChainABI as abi } from "../abi/contractABI";
import "../App.css";

// Configurazione Client e Contratto
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ 
  client, 
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});

// --- Componente: Form di Registrazione (Completo) ---
const RegistrationForm = () => {
    const account = useActiveAccount();
    const [formData, setFormData] = useState({ companyName: "", contactEmail: "", sector: "" });
    const [isSending, setIsSending] = useState(false);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.companyName || !formData.contactEmail || !formData.sector) { alert("Compila i campi obbligatori."); return; }
        setIsSending(true);
        try {
            const response = await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, walletAddress: account?.address }) });
            if (response.ok) { alert('✅ Richiesta inviata!'); } else { throw new Error('Errore del server.'); }
        } catch (error) { alert(`❌ Errore: ${(error as Error).message}`); } finally { setIsSending(false); }
    };
    const settori = ["Agricoltura", "Alimentare", "Moda", "Arredamento", "Altro"];
    return (
        <div className="card">
            <h3>Benvenuto su Easy Chain!</h3>
            <p>Per attivare il tuo account compila queste informazioni.</p>
            <form onSubmit={handleSubmit}>
                <div className="form-group"><label>Nome azienda <span style={{color: 'red'}}>*</span></label><input type="text" name="companyName" onChange={handleInputChange} className="form-input" required /></div>
                <div className="form-group"><label>Email contatto <span style={{color: 'red'}}>*</span></label><input type="email" name="contactEmail" onChange={handleInputChange} className="form-input" required /></div>
                <div className="form-group"><label>Settore <span style={{color: 'red'}}>*</span></label><select name="sector" onChange={handleInputChange} className="form-input" required><option value="">Seleziona...</option>{settori.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <button type="submit" className="web3-button" disabled={isSending}>{isSending ? 'Invio...' : 'Invia Richiesta'}</button>
            </form>
        </div>
    );
};

// --- Componente: Dashboard per Utente Attivo ---
const ActiveUserDashboard = () => (
    <div className="card">
        <h3 style={{color: '#34d399'}}>✅ ACCOUNT ATTIVATO</h3>
        <p>Benvenuto! Crea un batch di prova. Il gas sarà sponsorizzato.</p>
        <TransactionButton
            transaction={() => prepareContractCall({
                contract, abi, method: "initializeBatch",
                params: ["Lotto Prova V5", "Creato con AA!", new Date().toLocaleDateString(), "Web App V5", "ipfs://..."]
            })}
            onTransactionConfirmed={() => alert("✅ Batch creato!")}
            onError={(error) => alert(`❌ Errore: ${error.message}`)}
            className="web3-button"
        >
            Crea Batch (Gasless)
        </TransactionButton>
    </div>
);

// --- Componente Principale della Pagina ---
export default function AziendaPage() {
  const account = useActiveAccount();
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (account) {
        setIsLoading(true);
        try {
          const data = await readContract({ contract, abi, method: "getContributorInfo", params: [account.address] });
          setIsActive(data[2]);
        } catch (e) { setIsActive(false); }
        finally { setIsLoading(false); }
      } else { setIsLoading(false); }
    };
    checkStatus();
  }, [account]);

  const renderContent = () => {
    if (!account) return <p style={{textAlign: 'center'}}>Connettiti per iniziare.</p>;
    if (isLoading) return <p style={{textAlign: 'center'}}>Verifica stato...</p>;
    return isActive ? <ActiveUserDashboard /> : <RegistrationForm />;
  };

  return (
    <div className="app-container">
      <aside className="sidebar"><h1 className="sidebar-title">Easy Chain</h1>{account && <div className="user-info"><p><strong>Wallet:</strong></p><p>{account.address}</p></div>}</aside>
      <main className="main-content">
        <header className="header">
          <ConnectButton
            client={client}
            wallets={[inAppWallet()]} // <-- Mostra SOLO i login social/email
            accountAbstraction={{ chain: polygon, sponsorGas: true }}
            appMetadata={{ name: "Easy Chain", url: "https://easychain.com" }}
          />
        </header>
        <h2 className="page-title">Portale Aziende</h2>
        {renderContent()}
      </main>
    </div>
  );
}
