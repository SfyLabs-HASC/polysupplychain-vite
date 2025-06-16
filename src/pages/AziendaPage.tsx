import React, { useEffect, useState } from "react";
import {
  ConnectButton,
  TransactionButton,
  useActiveAccount,
} from "thirdweb/react";
import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
  parseEventLogs,
} from "thirdweb";
import { polygon } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";
import { supplyChainABI as abi } from "../abi/contractABI";
import "../App.css";

// Client e contratto
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({
  client,
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302",
});

// Modal generico
const Modal = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>{title}</h2>
      <hr style={{ margin: "1rem 0", borderColor: "#27272a" }} />
      {children}
      <button onClick={onClose} style={{ marginTop: "2rem", background: "none", border: "none", color: "#aaa" }}>Annulla</button>
    </div>
  </div>
);

// Dashboard per contributor attivi
const ContributorDashboard = () => {
  const [modal, setModal] = useState<"init" | "add" | "close" | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<bigint | null>(null);

  const handleSuccess = (receipt: any, type: string) => {
    if (type === "init") {
      const events = parseEventLogs({ logs: receipt.logs, abi, eventName: "BatchInitialized" });
      const batchId = events[0].args.batchId;
      setActiveBatchId(batchId);
      alert(`✅ Batch inizializzato. ID: ${batchId}`);
    } else if (type === "add") {
      alert("✅ Step aggiunto al batch.");
    } else if (type === "close") {
      alert("✅ Batch chiuso.");
      setActiveBatchId(null);
    }
    setModal(null);
  };

  return (
    <div className="card">
      <h3 style={{ color: "#34d399" }}>✅ Account Attivo</h3>
      <p>Puoi gestire i tuoi lotti. Le operazioni sono gasless.</p>

      {activeBatchId && (
        <div className="info-box">
          <p>Batch Attivo: <strong>{activeBatchId.toString()}</strong></p>
        </div>
      )}

      <div className="modal-actions">
        <button className="web3-button" onClick={() => setModal("init")}>1. Inizializza Batch</button>
        <button className="web3-button" disabled={!activeBatchId} onClick={() => setModal("add")}>2. Aggiungi Step</button>
        <button className="web3-button" disabled={!activeBatchId} style={{ backgroundColor: "#ef4444" }} onClick={() => setModal("close")}>3. Chiudi Batch</button>
      </div>

      {modal === "init" && (
        <Modal title="Inizializza Nuovo Batch" onClose={() => setModal(null)}>
          <TransactionButton
            transaction={() =>
              prepareContractCall({
                contract,
                abi,
                method: "initializeBatch",
                params: ["Lotto Test", "Descrizione", new Date().toISOString(), "Luogo", "ipfs://..."],
              })
            }
            onTransactionConfirmed={(r) => handleSuccess(r, "init")}
            className="web3-button"
          >
            Conferma
          </TransactionButton>
        </Modal>
      )}

      {modal === "add" && activeBatchId && (
        <Modal title="Aggiungi Step" onClose={() => setModal(null)}>
          <TransactionButton
            transaction={() =>
              prepareContractCall({
                contract,
                abi,
                method: "addStepToBatch",
                params: [activeBatchId, "Step Test", "Dettagli", new Date().toISOString(), "Luogo", "ipfs://..."],
              })
            }
            onTransactionConfirmed={(r) => handleSuccess(r, "add")}
            className="web3-button"
          >
            Conferma
          </TransactionButton>
        </Modal>
      )}

      {modal === "close" && activeBatchId && (
        <Modal title="Chiudi Batch" onClose={() => setModal(null)}>
          <TransactionButton
            transaction={() =>
              prepareContractCall({
                contract,
                abi,
                method: "closeBatch",
                params: [activeBatchId],
              })
            }
            onTransactionConfirmed={(r) => handleSuccess(r, "close")}
            className="web3-button"
            style={{ backgroundColor: "#ef4444" }}
          >
            Conferma Chiusura
          </TransactionButton>
        </Modal>
      )}
    </div>
  );
};

// Form per richiedere attivazione account
const ActivationRequestForm = () => {
  const account = useActiveAccount();
  const [form, setForm] = useState({ companyName: "", email: "", sector: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName || !form.email || !form.sector) return alert("Compila tutti i campi richiesti.");
    setLoading(true);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, wallet: account?.address }),
      });
      if (!res.ok) throw new Error("Errore invio");
      alert("✅ Richiesta inviata.");
    } catch (err) {
      alert("❌ Errore: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>Richiesta Attivazione</h3>
      <p>Compila il form per diventare contributor della piattaforma.</p>
      <form onSubmit={handleSubmit}>
        <input name="companyName" placeholder="Nome Azienda *" onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email *" onChange={handleChange} required />
        <select name="sector" onChange={handleChange} required>
          <option value="">Settore *</option>
          <option>Agricoltura</option>
          <option>Moda</option>
          <option>Alimentare</option>
        </select>
        <button className="web3-button" disabled={loading}>
          {loading ? "Invio..." : "Invia Richiesta"}
        </button>
      </form>
    </div>
  );
};

// Pagina principale
export default function AziendaPage() {
  const account = useActiveAccount();
  const [isContributor, setIsContributor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!account) return setLoading(false);
      try {
        const info = await contract.read.getContributorInfo([account.address]);
        setIsContributor(info.isActive);
      } catch {
        setIsContributor(false);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [account]);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Easy Chain</h1>
        </div>
        {account && (
          <div className="user-info">
            <p><strong>Wallet:</strong><br />{account.address}</p>
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

        {!account ? (
          <p style={{ textAlign: "center", marginTop: "4rem" }}>🔗 Connetti il tuo wallet per iniziare.</p>
        ) : loading ? (
          <p style={{ textAlign: "center", marginTop: "4rem" }}>⏳ Caricamento...</p>
        ) : isContributor ? (
          <ContributorDashboard />
        ) : (
          <ActivationRequestForm />
        )}
      </main>
    </div>
  );
}
