import { ConnectButton } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { polygon } from "thirdweb/chains";
import "../App.css";

// La client ID è pubblica e sicura da esporre nel codice frontend
const client = createThirdwebClient({
  clientId: "c973587b1f63d047274355524317094d",
});

function HomePage() {
  return (
    <div className="container">
      <div className="header">
        <h1>Benvenuto nella PoliSupplyChain</h1>
        <p>
          Questa DApp permette di tracciare la filiera di un prodotto.
          <br />
          Connettiti con il tuo wallet per iniziare.
        </p>
      </div>

      <div className="connect-button-container">
        {/*
          Il ConnectButton è stato semplificato.
          Eredita automaticamente i wallet dal ThirdwebProvider.
          Abbiamo rimosso la prop 'wallets' e l'import corrispondente.
        */}
        <ConnectButton
          client={client}
          chain={polygon}
          connectButton={{
            label: "Connetti il Wallet",
            style: {
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              padding: "15px 30px",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "18px",
              fontWeight: "bold",
            },
          }}
          connectModal={{
            size: "compact",
            title: "Scegli un Wallet",
            titleIcon: "",
            showThirdwebBranding: false,
          }}
        />
      </div>

      <div className="info-box">
        <p>
          Sei un <strong>Produttore</strong>? Vai alla sezione Admin per
          registrare nuovi prodotti e aggiornare la loro filiera.
          <br />
          Sei un <strong>Cliente</strong>? Vai alla sezione User per
          verificare l'autenticità di un prodotto tramite il suo ID.
        </p>
      </div>

      <footer className="footer">
        <p>&copy; 2024 PoliSupplyChain. Realizzato da HASC.</p>
      </footer>
    </div>
  );
}

export default HomePage;