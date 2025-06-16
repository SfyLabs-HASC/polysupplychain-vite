import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { ThirdwebProvider } from "thirdweb/react";
import { metamaskWallet, coinbaseWallet, walletConnect } from "thirdweb/wallets";

import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/*
      Il ThirdwebProvider ora contiene la configurazione dei wallet.
      Nota che i wallet vengono invocati come funzioni: metamaskWallet().
      Questa configurazione sarà ereditata da tutti i componenti ConnectButton nell'app.
    */}
    <ThirdwebProvider
      supportedWallets={[metamaskWallet(), coinbaseWallet(), walletConnect()]}
    >
      <Router>
        <App />
      </Router>
    </ThirdwebProvider>
  </React.StrictMode>
);