// FILE: src/pages/AdminPage.tsx
// Corretto per rimuovere la proprietà "supportedWallets" non valida dal pulsante.

import { ConnectWallet, useAddress, useContract, useContractRead } from "@thirdweb-dev/react";

const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302";

// Componente che renderizza il contenuto dell'admin
const AdminDashboard = () => {
  const address = useAddress();
  const { contract } = useContract(contractAddress);

  // Leggiamo gli indirizzi di superOwner e owner dal contratto
  const { data: superOwner, isLoading: isLoadingSuperOwner } = useContractRead(contract, "superOwner");
  const { data: owner, isLoading: isLoadingOwner } = useContractRead(contract, "owner");

  const renderAdminContent = () => {
    if (isLoadingSuperOwner || isLoadingOwner) {
      return <p>Verifica permessi in corso...</p>;
    }

    const isSuperOwner = address && superOwner && address.toLowerCase() === superOwner.toLowerCase();
    const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();

    if (isSuperOwner || isOwner) {
      return <h2 style={{ color: '#34d399', fontSize: '2rem' }}>✅ ACCESSO CONSENTITO</h2>;
    } else {
      return <h2 style={{ color: '#ef4444', fontSize: '2rem' }}>❌ ACCESSO NEGATO</h2>;
    }
  };

  return (
    <div style={{ marginTop: '3rem' }}>
      {renderAdminContent()}
      {/* Qui in futuro aggiungeremo la tabella delle aziende in pending */}
    </div>
  );
};


export default function AdminPage() {
  const address = useAddress();

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#0a0a0a', color: 'white', minHeight: '100vh', textAlign: 'center' }}>
      <h1>Pannello Amministrazione</h1>
      <p>Connetti il tuo wallet da amministratore per accedere.</p>
      
      <div style={{ margin: '2rem auto', display: 'inline-block' }}>
        {/* MODIFICA: Rimuoviamo la proprietà "supportedWallets" che causava l'errore */}
        <ConnectWallet 
          theme="dark" 
          btnTitle="Connetti Wallet Admin"
        />
      </div>

      {address && <AdminDashboard />}
    </div>
  );
}
