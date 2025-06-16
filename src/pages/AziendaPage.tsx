import React, { useEffect, useState } from "react";
import {
  ConnectButton,
  TransactionButton,
  useActiveAccount,
} from "thirdweb/react";
import {
  createThirdwebClient,
  getContract,
  readContract,
  prepareContractCall,
  parseEventLogs,
} from "thirdweb";
import { polygon } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";
import { supplyChainABI as abi } from "../abi/contractABI";
import FormModal from "../components/FormModal"; // <-- assicurati che esista
import "../App.css";

// Configurazione client e contratto
const client = createThirdwebClient({
  clientId: "e40dfd747fabedf48c5837fb79caf2eb",
});
const contract = getContract({
  client,
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302",
});

export default function AziendaPage() {
  const account = useActiveAccount();
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [credits, setCredits] = useState("N/A");

  const [modal, setModal] = useState<"init" | "add" | "close" | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<bigint | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (!account) {
        setIsActive(false);
        setCredits("N/A");
        setIsLoading(false);
        return;
      }

      try {
        const data = (await readContract({
          contract,
          abi,
          method: "getContributorInfo",
          params: [account.address],
        })) as [string, bigint, boolean];

        setCredits(data[1].toString());
        setIsActive(data[2]);
      } catch (e) {
        setIsActive(false);
        setCredits("N/A");
      } finally {
        setIsLoading(false);
      }
    };
    checkStatus();
  }, [account]);

  const handleTransactionSuccess = (
    receipt: any,
    type: "init" | "add" | "close"
  ) => {
    setModal(null);

    if (type === "init") {
      try {
        const events = parseEventLogs({
          logs: receipt.logs,
          abi,
          eventName: "BatchInitialized",
        });
        const newBatchId = events[0].args.batchId;
        setActiveBatchId(newBatchId);
        alert(`✅ Batch Inizializzato! ID: ${newBatchId}`);
      } catch {
        alert("✅ Batch creato, ma non è stato possibile leggere l'ID.");
      }
    } else if (type === "add") {
      alert(`✅ Step aggiunto al batch ${activeBatchId}!`);
    } else if (type === "close") {
      alert(`✅ Batch ${activeBatchId} chiuso.`);
      setActiveBatchId(null);
    }
  };

  const RegistrationForm = () => {
    const [formData, setFormData] = useState({
      companyName: "",
      contactEmail: "",
      sector: "",
    });
    const [sending, setSending] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSending(true);

      try {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            walletAddress: account?.address,
          }),
        });

        if (!res.ok) throw new Error("Errore durante l'invio.");
        alert("✅ Richiesta inviata. Verrai contattato a breve.");
      } catch (err) {
        alert("❌ Errore: " + (err as Error).message);
      } finally {
        setSending(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="card">
        <h3>Registrazione Azienda</h3>
        <input
          type="text"
          name="companyName"
          placeholder="Nome azienda"
          required
          onChange={handleChange}
          className="form-input"
        />
        <input
          type="email"
          name="contactEmail"
          placeholder="Email contatto"
          required
          onChange={handleChange}
          className="form-input"
        />
        <select
          name="sector"
          required
          onChange={handleChange}
          className="form-input"
        >
          <option value="">Settore</option>
          <option>Agricoltura</option>
          <option>Moda</option>
          <option>Alimentare</option>
          <option>Altro</option>
        </select>
        <button type="submit" className="web3-button" disabled={sending}>
          {sending ? "Invio in corso..." : "Invia Richiesta"}
        </button>
      </form>
    );
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">Easy Chain</h1>
        </div>
        {account && (
          <div className="user-info">
            <p>
              <strong>Wallet:</strong>
            </p>
            <p style={{ wordBreak: "break-all" }}>{account.address}</p>
            <hr />
            <p>
              <strong>Crediti:</strong>
            </p>
            <p>{credits}</p>
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
          <p>Connettiti per iniziare</p>
        ) : isLoading ? (
          <p>Verifica account...</p>
        ) : isActive ? (
          <div className="card">
            <h3>✅ ACCOUNT ATTIVO</h3>
            {activeBatchId && (
              <p>Batch Attivo: <strong>{activeBatchId.toString()}</strong></p>
            )}

            <div className="modal-actions">
              <button className="web3-button" onClick={() => setModal("init")}>
                1. Inizializza Batch
              </button>
              <button
                className="web3-button"
                onClick={() => setModal("add")}
                disabled={!activeBatchId}
              >
                2. Aggiungi Step
              </button>
              <button
                className="web3-button"
                onClick={() => setModal("close")}
                disabled={!activeBatchId}
                style={{ backgroundColor: "#ef4444" }}
              >
                3. Chiudi Batch
              </button>
            </div>
          </div>
        ) : (
          <RegistrationForm />
        )}

        {/* --- MODALS --- */}
        <FormModal isOpen={modal === "init"} onClose={() => setModal(null)} title="Nuovo Batch">
          <p>Crea un nuovo batch.</p>
          <TransactionButton
            className="web3-button"
            transaction={() =>
              prepareContractCall({
                contract,
                abi,
                method: "initializeBatch",
                params: [
                  "Batch Demo",
                  "Descrizione demo",
                  new Date().toLocaleDateString(),
                  "Web App",
                  "ipfs://demo",
                ],
              })
            }
            onTransactionConfirmed={(receipt) => handleTransactionSuccess(receipt, "init")}
            onError={(err) => alert("Errore: " + err.message)}
          >
            Conferma
          </TransactionButton>
        </FormModal>

        <FormModal isOpen={modal === "add"} onClose={() => setModal(null)} title="Aggiungi Step">
          <p>Aggiungi uno step al batch attivo.</p>
          <TransactionButton
            className="web3-button"
            transaction={() =>
              prepareContractCall({
                contract,
                abi,
                method: "addStepToBatch",
                params: [
                  activeBatchId!,
                  "Step Demo",
                  "Dettagli",
                  new Date().toLocaleDateString(),
                  "Sede",
                  "ipfs://demo",
                ],
              })
            }
            onTransactionConfirmed={(receipt) => handleTransactionSuccess(receipt, "add")}
            onError={(err) => alert("Errore: " + err.message)}
          >
            Conferma
          </TransactionButton>
        </FormModal>

        <FormModal isOpen={modal === "close"} onClose={() => setModal(null)} title="Chiudi Batch">
          <p>Sei sicuro di voler chiudere il batch?</p>
          <TransactionButton
            className="web3-button"
            transaction={() =>
              prepareContractCall({
                contract,
                abi,
                method: "closeBatch",
                params: [activeBatchId!],
              })
            }
            onTransactionConfirmed={(receipt) => handleTransactionSuccess(receipt, "close")}
            onError={(err) => alert("Errore: " + err.message)}
          >
            Conferma Chiusura
          </TransactionButton>
        </FormModal>
      </main>
    </div>
  );
}
