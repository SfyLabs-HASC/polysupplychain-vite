// FILE: src/main.tsx
// Corretto per risolvere l'errore di configurazione di inAppWallet

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import "./index.css";

// Importiamo le opzioni di wallet che vogliamo supportare
import { inAppWallet } from "@thirdweb-dev/react";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <ThirdwebProvider
      activeChain="polygon"
      clientId="e40dfd747fabedf48c5837fb79caf2eb"
      
      // Corretto: La configurazione avanzata va fatta sulla dashboard.
      // Qui specifichiamo solo quale tipo di wallet supportare.
      supportedWallets={[
        inAppWallet(),
      ]}
    >
      <App />
    </ThirdwebProvider>
  </React.StrictMode>
);
