// FILE: src/main.tsx
// AGGIORNATO: Il router ora punta alla nuova pagina AziendaPage.

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import "./index.css";

import { inAppWallet, metamaskWallet, coinbaseWallet, walletConnect } from "@thirdweb-dev/react";

import HomePage from "./pages/HomePage";
import AziendaPage from "./pages/AziendaPage"; // <-- NUOVA PAGINA
import AdminPage from "./pages.AdminPage";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThirdwebProvider
        activeChain="polygon"
        clientId="e40dfd747fabedf48c5837fb79caf2eb"
        supportedWallets={[
          inAppWallet(),
          metamaskWallet(),
          coinbaseWallet(),
          walletConnect(),
        ]}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/azienda" element={<AziendaPage />} /> {/* <-- NUOVO PERCORSO */}
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </ThirdwebProvider>
    </BrowserRouter>
  </React.StrictMode>
);
