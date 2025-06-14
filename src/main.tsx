// FILE: src/main.tsx
// AGGIORNATO per gestire la navigazione tra le pagine.

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import "./index.css";

// Importiamo i wallet che serviranno in tutto il sito
import { inAppWallet, metamaskWallet } from "@thirdweb-dev/react";

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
        supportedWallets={[
          // Wallet per gli utenti (social)
          inAppWallet(),
          // Wallet per l'admin (MetaMask, etc.)
          metamaskWallet(),
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
