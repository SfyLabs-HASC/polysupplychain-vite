// FILE: src/pages/AdminPage.tsx
// AGGIORNATO: Il pulsante di login ora è configurato per i wallet da admin.

import { ConnectWallet, useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
// Importiamo i wallet che vogliamo mostrare all'admin
import { metamaskWallet, coinbaseWallet, walletConnect } from "@thirdweb-dev/react";

const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302";

// ... Il componente AdminDashboard rimane identico ...

export default function AdminPage() {
  const address = useAddress();

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#0a0a0a', color: 'white', minHeight: '100vh', textAlign: 'center' }}>
      <h1>Pannello Amministrazione</h1>
      <p>Connetti il tuo wallet da amministratore per accedere.</p>
      
      <div style={{ margin: '2rem auto', display: 'inline-block' }}>
        {/* MODIFICA CHIAVE: Il pulsante ora mostra solo wallet tradizionali */}
        <ConnectWallet 
          theme="dark" 
          btnTitle="Connetti Wallet Admin"
          wallets={[
            metamaskWallet(),
            coinbaseWallet(),
            walletConnect(),
          ]}
        />
      </div>

      {address && <AdminDashboard />}
    </div>
  );
}

// Assicurati di copiare e incollare qui sotto il componente completo AdminDashboard!
