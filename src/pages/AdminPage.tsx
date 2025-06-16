// FILE: src/pages/AdminPage.tsx
// Pagina Admin con login completo e sintassi V5 corretta.

import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, readContract } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { useState, useEffect } from "react";
import { abi } from "../abi/SupplyChainV2.json";
import "../App.css";

const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ 
  client, 
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});

// Nota: la logica della dashboard admin andrebbe qui, per ora è un segnaposto
const AdminDashboard = () => { return <div><h3 style={{color: '#34d399'}}>✅ ACCESSO CONSENTITO</h3><p>Benvenuto, SFY Labs!</p></div>; };

export default function AdminPage() {
  const account = useActiveAccount();
  const [isAllowed, setIsAllowed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (account) {
        setIsLoading(true);
        try {
          // Usiamo la sintassi corretta per V5 per leggere i dati
          const [superOwner, owner] = await Promise.all([
            readContract({ contract, method: "function superOwner() returns (address)" }),
            readContract({ contract, method: "function owner() returns (address)" })
          ]);
          // Confrontiamo gli indirizzi in minuscolo per sicurezza
          const isAdmin = account.address.toLowerCase() === superOwner.toLowerCase() || (owner && account.address.toLowerCase() === owner.toLowerCase());
          setIsAllowed(isAdmin);
        } catch (e) {
          console.error("Permission check failed:", e);
          setIsAllowed(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        setIsAllowed(false);
      }
    };
    checkPermissions();
  }, [account]);

  return (
    <div className="app-container">
      <main className="main-content" style={{width: '100%'}}>
        <header className="header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Pannello Amministrazione</h1>
          {/* Pulsante di connessione standard per l'admin.
            Non specificando la prop 'wallets', mostrerà tutte le opzioni
            di default, inclusi MetaMask, Coinbase Wallet, etc.
          */}
          <ConnectButton
            client={client}
            // Non specifichiamo l'account abstraction per l'admin,
            // così pagherà il gas normalmente con il suo wallet.
          />
        </header>
        {!account ? <p style={{textAlign: 'center', marginTop: '2rem'}}>Connetti il tuo wallet da amministratore.</p> : 
         isLoading ? <p style={{textAlign: 'center', marginTop: '2rem'}}>Verifica permessi...</p> :
         isAllowed ? <AdminDashboard /> : 
         <h2 style={{ color: '#ef4444' }}>❌ ACCESSO NEGATO</h2>}
      </main>
    </div>
  );
}
