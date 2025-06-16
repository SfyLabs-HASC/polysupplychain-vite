// FILE: src/pages/AziendaPage.tsx

import React, { useState, useEffect } from "react";
import {
  ConnectButton,
  TransactionButton,
  useActiveAccount
} from "thirdweb/react";
import {
  createThirdwebClient,
  getContract,
  parseEventLogs,
  prepareContractCall
} from "thirdweb";
import { polygon } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";
import { supplyChainABI as abi } from "../abi/contractABI";
import "../App.css";

// --- Configurazione Thirdweb ---
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({
  client,
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});

// --- Modale Riutilizzabile ---
const FormModal = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>{title}</h2>
      <hr style={{ margin: '1rem 0', borderColor: '#27272a' }} />
      {children}
      <button onClick={onClose} style={{ marginTop: '2rem', background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer' }}>Annulla</button>
    </div>
  </div>
);

// --- Dashboard Utente Attivo ---
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
      } catch {
        alert("✅ Batch creato, ma non è stato possibile recuperare l'ID.");
      }
    } else if (type === 'add') {
      alert(`✅ Step aggiunto al batch ${activeBatchId}`);
    } else if (type === 'close') {
      alert(`✅ Batch ${activeBatchId} chiuso!`);
      setActiveBatchId(null);
    }
  };

  return (
    <div className="card">
      <h3 style={{ color: '#34d399' }}>✅ ACCOUNT ATTIVATO</h3>
      <p>Benvenuto nella tua dashboard. Le seguenti azioni sono sponsorizzate (gasless).</p>

      {activeBatchId && (
        <div className="info-box">
          <p>Batch Attivo: <strong>{activeBatchId.toString()}</strong></p>
        </div>
      )}

      <div className="modal-actions">
        <button className="web3-button" onClick={() => setModal('init')}>1. Inizializza Batch</button>
        <button className="web3-button" onClick={() => setModal('add')} disabled={!activeBatchId}>2. Aggiungi Step</button>
        <button className="web3-button" onClick={() => setModal('close')} disabled={!activeBatchId} style={{ backgroundColor: '#ef4444' }}>3. Chiudi Batch</button>
      </div>

      {modal === 'init' && (
        <FormModal title="Inizializza Nuovo Batch" onClose={() => setModal(null)}>
          <TransactionButton
            transaction={() => prepareContractCall({
              contract,
              abi,
              method: "initializeBatch",
              params: ["Lotto Prova", "Descrizione", new Date().toLocaleDateString(), "Luogo", "ipfs://..."]
            })}
            onTransactionConfirmed={(receipt) => handleTransactionSuccess(receipt, 'init')}
            onError={(err) => alert(`❌ Errore: ${err.message}`)}
            className="web3-button"
          >
            Conferma Inizializzazione
          </TransactionButton>
        </FormModal>
      )}

      {modal === 'add' && activeBatchId && (
        <FormModal title={`Aggiungi Step al Batch #${activeBatchId.toString()}`} onClose={() => setModal(null)}>
          <TransactionButton
            transaction={() => prepareContractCall({
              contract,
              abi,
              method: "addStepToBatch",
              params: [activeBatchId, "Nuovo Step", "Dettagli", new Date().toLocaleDateString(), "Luogo", "ipfs://..."]
            })}
            onTransactionConfirmed={(receipt) => handleTransactionSuccess(receipt, 'add')}
            onError={(err) => alert(`❌ Errore: ${err.message}`)}
            className="web3-button"
          >
            Conferma Aggiunta Step
          </TransactionButton>
        </FormModal>
      )}

      {modal === 'close' && activeBatchId && (
        <FormModal title={`Chiudi Batch #${activeBatchId.toString()}`} onClose={() => setModal(null)}>
          <TransactionButton
            transaction={() => prepareContractCall({
              contract,
              abi,
              method: "closeBatch",
              params: [activeBatchId]
            })}
            onTransactionConfirmed={(receipt) => handleTransactionSuccess(receipt, 'close')}
            onError={(err) => alert(`❌ Errore: ${err.message}`)}
            className="web3-button"
            style={{ backgroundColor: '#ef4444' }}
          >
            Conferma Chiusura
          </TransactionButton>
        </FormModal>
      )}
    </div>
  );
};

// --- Form di Registrazione ---
const RegistrationForm = () => {
  const account = useActiveAccount();
  const [formData, setFormData] = useState({
    companyName: "", contactEmail: "", sector: "",
    website: "", facebook: "", instagram: "", twitter: "", tiktok: "",
  });
  const [isSending, setIsSending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.contactEmail || !formData.sector) {
      return alert("Compila tutti i campi obbligatori.");
    }
    setIsSending(true);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, walletAddress: account?.address }),
      });
      if (!res.ok) throw new Error("Errore invio email.");
      alert("✅ Richiesta inviata!");
    } catch (err) {
      alert(`❌ Errore: ${(err as Error).message}`);
    } finally {
      setIsSending(false);
    }
  };

  const settori = [
    "Agricoltura e Allevamento", "Alimentare e Bevande", "Moda e Tessile",
    "Arredamento e Design", "Cosmetica e Farmaceutica", "Artigianato",
    "Tecnologia ed Elettronica", "Altro"
  ];

  return (
    <div className="card">
      <h3>Benvenuto su Easy Chain!</h3>
      <p>Compila il modulo per richiedere l’attivazione.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group"><label>Nome azienda *</label><input name="companyName" onChange={handleChange} required /></div>
        <div className="form-group"><label>Email contatto *</label><input name="contactEmail" type="email" onChange={handleChange} required /></div>
        <div className="form-group">
          <label>Settore *</label>
          <select name="sector" onChange={handleChange} required>
            <option value="">Seleziona...</option>
            {settori.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <hr />
        <div className="form-group"><label>Sito Web</label><input name="website" type="url" onChange={handleChange} /></div>
        <div className="form-group"><label>Facebook</label><input name="facebook" type="url" onChange={handleChange} /></div>
        <div className="form-group"><label>Instagram</label><input name="instagram" type="url" onChange={handleChange} /></div>
        <div className="form-group"><label>Twitter / X</label><input name="twitter" type="url" onChange={handleChange} /></div>
        <div className="form-group"><label>TikTok</label><input name="tiktok" type="url" onChange={handleChange} /></div>
        <button className="web3-button" disabled={isSending}>
          {isSending ? "Invio in corso..." : "Invia Richiesta di Attivazione"}
        </button>
      </form>
    </div>
  );
};

// --- Componente Principale ---
export default function AziendaPage() {
  const account = useActiveAccount();
  const [isActive, setIsActive] = useState(false);
  const [credits, setCredits] = useState("N/A");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!account) {
        setIsActive(false);
        setCredits("N/A");
        setLoading(false);
        return;
      }
      try {
        const data = await contract.read.getContributorInfo([account.address]);
        setIsActive(data.isActive);
        setCredits(data.credits.toString());
      } catch {
        setIsActive(false);
        setCredits("N/A");
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [account]);

  const renderContent = () => {
    if (!account) return <p style={{ textAlign: 'center', marginTop: '4rem' }}>Connettiti per iniziare.</p>;
    if (loading) return <p style={{ textAlign: 'center', marginTop: '4rem' }}>Verifica dello stato account...</p>;
    return isActive ? <ActiveUserDashboard /> : <RegistrationForm />;
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header"><h1 className="sidebar-title">Easy Chain</h1></div>
        {account && (
          <div className="user-info">
            <p><strong>Wallet:</strong><br />{account.address}</p>
            <hr />
            <p><strong>Crediti:</strong><br />{loading ? "..." : credits}</p>
          </div>
        )}
      </aside>
      <main className="main-content">
        <header className="header">
          <ConnectButton
            client={client}
            wallets={[inAppWallet()]}
            accountAbstraction={{ chain: polygon, sponsorGas: true }}
          />
        </header>
        <h2 className="page-title">Portale Aziende</h2>
        {renderContent()}
      </main>
    </div>
  );
}
