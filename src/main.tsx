// FILE: src/main.tsx
// AGGIORNATO: Ora legge la chiave di accesso da una variabile d'ambiente sicura.

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import "./App.css";

// 1. Importiamo gli strumenti da Sequence e wagmi
import { KitProvider } from '@0xsequence/kit';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { SequenceWagmiConnector } from '@0xsequence/wagmi-connector';

// 2. Importiamo le nostre pagine
import HomePage from "./pages/HomePage";
import AziendaPage from "./pages/AziendaPage";
import AdminPage from "./pages/AdminPage";

// 3. Configurazione di Wagmi
const wagmiConfig = createConfig({
  chains: [polygon],
  transports: {
    [polygon.id]: http(),
  },
  connectors: [
    new SequenceWagmiConnector({
      appName: 'Easy Chain',
      // MODIFICA CHIAVE: Leggiamo la chiave in modo sicuro dall'ambiente.
      projectAccessKey: import.meta.env.VITE_SEQUENCE_PROJECT_ACCESS_KEY,
    }),
  ],
});

const container = document.getElementById("root");
const root = createRoot(container!);

// 4. Render dell'applicazione
root.render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <KitProvider config={wagmiConfig}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/azienda" element={<AziendaPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </BrowserRouter>
      </KitProvider>
    </WagmiProvider>
  </React.StrictMode>
);
