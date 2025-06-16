// FILE: src/pages/AdminPage.tsx
// Pagina Admin aggiornata con la sintassi V5.

import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, readContract } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { useState, useEffect } from "react";
import { abi } from "../abi/SupplyChainV2.json";
import "../App.css";

const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ client, chain: polygon, address: "0x4a866C3A071816E3186e18cbE99a3339f4571302" });

const AdminDashboard = () => { /* La tua dashboard admin con la lista aziende va qui */ return <div>Contenuto Admin...</div>; };

export default function AdminPage() {
  const account = useActiveAccount();
  const [isAllowed, setIsAllowed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (account) {
        setIsLoading(true);
        try {
          const superOwner = await readContract({ contract, method: "superOwner" });
          const owner = await readContract({ contract, method: "owner" });
          const isAdmin = account.address.toLowerCase() === superOwner.toLowerCase() || account.address.toLowerCase() === owner.toLowerCase();
          setIsAllowed(isAdmin);
        } catch (e) { setIsAllowed(false); }
        finally { setIsLoading(false); }
      } else { setIsLoading(false); setIsAllowed(false); }
    };
    checkPermissions();
  }, [account]);

  return (
    <div className="app-container">
      <main className="main-content" style={{width: '100%'}}>
        <header className="header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Pannello Amministrazione</h1>
          {/* Pulsante di connessione standard per l'admin */}
          <ConnectButton client={client} />
        </header>
        {!account ? <p>Connetti il tuo wallet...</p> : 
         isLoading ? <p>Verifica permessi...</p> :
         isAllowed ? <div><h3>Benvenuto!</h3><AdminDashboard /></div> : 
         <h2 style={{ color: '#ef4444' }}>❌ ACCESSO NEGATO</h2>}
      </main>
    </div>
  );
}
