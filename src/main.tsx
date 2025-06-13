// FILE: src/main.tsx
// AGGIORNATO: Ora supporta SOLO In-App Wallets, con il login telefonico disabilitato.

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import "./index.css";

// Importiamo SOLO l'opzione di wallet che vogliamo supportare
import { inAppWallet } from "@thirdweb-dev/react";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <ThirdwebProvider
      activeChain="polygon"
      clientId="e40dfd747fabedf48c5837fb79caf2eb" // Il tuo Client ID
      
      // MODIFICATO: Abbiamo aggiunto le opzioni per disabilitare il telefono.
      supportedWallets={[
        inAppWallet({
          options: {
            phone: false, // Disabilita l'opzione di login con numero di telefono
          }
        }),
      ]}
    >
      <App />
    </ThirdwebProvider>
  </React.StrictMode>
);
