import { useState } from "react";
import { ConnectButton } from "thirdweb/react";
import {
  createThirdwebClient,
  getContract,
  readContract,
} from "thirdweb";
import { polygon } from "thirdweb/chains";
import { supplyChainABI as abi } from "../abi/contractABI";
import "../App.css";

// La client ID è pubblica e sicura da esporre nel codice frontend
const client = createThirdwebClient({
  clientId: "c973587b1f63d047274355524317094d",
});

const contract = getContract({
  client,
  chain: polygon,
  address: "0xb7294DA351829323315394212984187C51390494",
  abi,
});

function AziendaPage() {
  const [productId, setProductId] = useState("");
  const [productHistory, setProductHistory] = useState<string[]>([]);
  const [productName, setProductName] = useState("");
  const [error, setError] = useState("");

  const fetchProductHistory = async () => {
    if (!productId) {
      setError("Per favore, inserisci un ID prodotto.");
      return;
    }
    try {
      setError("");
      setProductHistory([]);
      setProductName("");

      const data = await readContract({
        contract,
        method: "getProductHistory",
        params: [BigInt(productId)],
      });

      // Il nome è il primo elemento, la storia sono tutti gli altri
      setProductName(data[0]);
      setProductHistory(data.slice(1));

      if (data.length <= 1) {
        setError("Nessuna cronologia trovata per questo prodotto.");
      }
    } catch (err) {
      console.error("Errore nel recuperare la cronologia:", err);
      setError("Prodotto non trovato o errore di rete.");
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Tracciabilità Prodotto</h1>
        <p>Controlla la cronologia di un prodotto per verificarne la filiera.</p>
        <ConnectButton client={client} chain={polygon} />
      </div>

      <div className="card">
        <h2>Cerca Prodotto per ID</h2>
        <input
          type="number"
          placeholder="ID del Prodotto"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="input-field"
        />
        <button
          onClick={fetchProductHistory}
          className="button"
          style={{ backgroundColor: "#007bff" }}
        >
          Cerca Cronologia
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {productName && (
        <div className="card result-card">
          <h2>
            Risultati per: <strong>{productName}</strong> (ID: {productId})
          </h2>
          {productHistory.length > 0 ? (
            <ul className="history-list">
              {productHistory.map((state, index) => (
                <li key={index} className="history-item">
                  <span className="step-number">{index + 1}</span>
                  <span className="step-state">{state}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Questo prodotto è stato registrato ma non ha ancora aggiornamenti di stato.</p>
          )}
        </div>
      )}

      <footer className="footer">
        <p>&copy; 2024 PoliSupplyChain. Realizzato da HASC.</p>
      </footer>
    </div>
  );
}

export default AziendaPage;