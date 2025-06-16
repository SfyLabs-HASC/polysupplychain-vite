import { useState } from "react";
import { ConnectButton, TransactionButton } from "thirdweb/react";
import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
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

function AdminPage() {
  const [productName, setProductName] = useState("");
  const [productState, setProductState] = useState("");
  const [productId, setProductId] = useState("");

  return (
    <div className="container">
      <div className="header">
        <h1>Pagina Amministratore</h1>
        <p>Gestisci la filiera dei prodotti.</p>
        {/*
          Anche qui, il ConnectButton è semplificato.
          Eredita i wallet dal provider globale.
        */}
        <ConnectButton client={client} chain={polygon} />
      </div>

      <div className="card">
        <h2>Aggiungi Prodotto</h2>
        <input
          type="text"
          placeholder="Nome del Prodotto"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="input-field"
        />
        <TransactionButton
          transaction={() =>
            prepareContractCall({
              contract,
              method: "addProduct",
              params: [productName],
            })
          }
          onTransactionConfirmed={() => {
            alert("Prodotto Aggiunto!");
            setProductName("");
          }}
          style={{
            backgroundColor: "#28a745",
            color: "white",
            marginTop: "10px",
          }}
        >
          Aggiungi Prodotto
        </TransactionButton>
      </div>

      <div className="card">
        <h2>Aggiorna Stato Prodotto</h2>
        <input
          type="number"
          placeholder="ID del Prodotto"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="input-field"
        />
        <input
          type="text"
          placeholder="Nuovo Stato"
          value={productState}
          onChange={(e) => setProductState(e.target.value)}
          className="input-field"
        />
        <TransactionButton
          transaction={() =>
            prepareContractCall({
              contract,
              method: "updateState",
              params: [BigInt(productId), productState],
            })
          }
          onTransactionConfirmed={() => {
            alert("Stato Aggiornato!");
            setProductId("");
            setProductState("");
          }}
          style={{
            backgroundColor: "#ffc107",
            color: "black",
            marginTop: "10px",
          }}
        >
          Aggiorna Stato
        </TransactionButton>
      </div>

      <footer className="footer">
        <p>&copy; 2024 PoliSupplyChain. Realizzato da HASC.</p>
      </footer>
    </div>
  );
}

export default AdminPage;