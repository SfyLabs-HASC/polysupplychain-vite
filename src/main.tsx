// FILE: src/main.tsx
// AGGIORNATO: Ora configura il routing e tutti i tipi di wallet.

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import "./index.css";

// Importiamo i wallet che serviranno in tutto il sito
import { inAppWallet, metamaskWallet, coinbaseWallet, walletConnect } from "@thirdweb-dev/react";

// Importiamo i nostri nuovi componenti di pagina
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    {/* BrowserRouter gestisce la navigazione */}
    <BrowserRouter>
      <ThirdwebProvider
        activeChain="polygon"
        clientId="e40dfd747fabedf48c5837fb79caf2eb"
        // Ora supportiamo sia i social login SIA i wallet tradizionali.
        // La scelta di quale usare sarà gestita dalle singole pagine.
        supportedWallets={[
          inAppWallet(),
          metamaskWallet(),
          coinbaseWallet(),
          walletConnect(),
        ]}
      >
        {/* Routes definisce quale componente mostrare per ogni URL */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </ThirdwebProvider>
    </BrowserRouter>
  </React.StrictMode>
);
