// FILE: src/main.tsx
// AGGIORNATO per coerenza, anche se non ha impatto visivo.

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import "./index.css";
import { inAppWallet } from "@thirdweb-dev/react";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <ThirdwebProvider
      activeChain="polygon"
      clientId="e40dfd747fabedf48c5837fb79caf2eb"
      supportedWallets={[inAppWallet()]}
    >
      <App />
    </ThirdwebProvider>
  </React.StrictMode>
);
