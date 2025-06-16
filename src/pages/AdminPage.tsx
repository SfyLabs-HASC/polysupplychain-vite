// FILE: src/pages/AdminPage.tsx
// AGGIORNATO: Versione più robusta con logging per il debug dei permessi.

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

const AdminDashboard = () => { 
    return (
        <div>
            <h3>Dashboard Amministratore</h3>
            <p>Le funzionalità di gestione verranno aggiunte qui.</p>
        </div>
    ); 
};

export default function AdminPage() {
  const account = useActiveAccount();
  const [isAllowed, setIsAllowed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Funzione asincrona per controllare i permessi
    const checkPermissions = async () => {
      // Eseguiamo il controllo solo se c'è un account connesso
      if (account) {
        setIsLoading(true);
        console.log("DEBUG: Account connesso:", account.address);

        try {
          // Leggiamo entrambi gli indirizzi dal contratto
          const [superOwner, owner] = await Promise.all([
            readContract({ contract, method: "superOwner" }),
            readContract({ contract, method: "owner" })
          ]);
          
          // Logghiamo i valori ricevuti per il debug
          console.log("DEBUG: SuperOwner dal contratto:", superOwner);
          console.log("DEBUG: Owner dal contratto:", owner);
          
          const connectedAddress = account.address.toLowerCase();
          const superOwnerAddress = (superOwner as string).toLowerCase();
          // Gestiamo il caso in cui l'owner non sia stato impostato (address(0))
          const ownerAddress = owner ? (owner as string).toLowerCase() : "0x0000000000000000000000000000000000000000";

          // Eseguiamo il confronto
          if (connectedAddress === superOwnerAddress || connectedAddress === ownerAddress) {
            console.log("DEBUG: Permessi CONFERMATI.");
            setIsAllowed(true);
          } else {
            console.log("DEBUG: Permessi NEGATI.");
            setIsAllowed(false);
          }
        } catch (e) {
          console.error("DEBUG: Errore durante il controllo dei permessi:", e);
          setIsAllowed(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Se non c'è un account, non è permesso e non sta caricando
        setIsLoading(false);
        setIsAllowed(false);
      }
    };

    checkPermissions();
  }, [account]); // L'effetto si attiva ogni volta che l'account cambia

  return (
    <div className="app-container">
      <main className="main-content" style={{width: '100%'}}>
        <header className="header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Pannello Amministrazione</h1>
          <ConnectButton client={client} />
        </header>
        
        {/* Logica di visualizzazione */}
        {!account ? (
            <p style={{textAlign: 'center', marginTop: '2rem'}}>Connetti il tuo wallet da amministratore per accedere.</p>
        ) : isLoading ? (
            <p style={{textAlign: 'center', marginTop: '2rem'}}>Verifica permessi in corso...</p>
        ) : isAllowed ? (
            <div>
                <h3>Benvenuto, SFY Labs!</h3>
                <AdminDashboard />
            </div>
        ) : (
            <h2 style={{ color: '#ef4444', textAlign: 'center', marginTop: '4rem' }}>❌ ACCESSO NEGATO</h2>
        )}
      </main>
    </div>
  );
}
