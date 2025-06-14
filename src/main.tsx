// FILE: src/main.tsx
// AGGIORNATO: Ora supporta SOLO In-App Wallets (Social/Email) per l'intera applicazione.

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import "./index.css";
import "./App.css";

// Importiamo SOLO il tipo di wallet che vogliamo supportare
import { inAppWallet } from "@thirdweb-dev/react";

// Importiamo i nostri componenti di pagina
import HomePage from "./pages/HomePage";
import AziendaPage from "./pages/AziendaPage";
import AdminPage from "./pages/AdminPage";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThirdwebProvider
        activeChain="polygon"
        clientId="e40dfd747fabedf48c5837fb79caf2eb"
        // MODIFICA CHIAVE:
        // L'array ora contiene solo inAppWallet(). Questo si applicherà
        // a tutti i pulsanti ConnectWallet del sito.
        supportedWallets={[
          inAppWallet(),
        ]}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/azienda" element={<AziendaPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </ThirdwebProvider>
    </BrowserRouter>
  </React.StrictMode>
);
