// FILE: src/App.tsx
// AGGIORNATO con il nuovo nome "Easy Chain"

import { ConnectWallet, Web3Button, useAddress, useContract } from "@thirdweb-dev/react";

// Indirizzo del tuo contratto deployato su Polygon Mainnet
const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302";

export default function App() {
  const address = useAddress();
  const { contract } = useContract(contractAddress);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#121212', color: 'white', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* MODIFICATO: Titolo principale aggiornato */}
        <h1 style={{ marginBottom: '2rem' }}>Easy Chain</h1>
        <ConnectWallet
          theme="dark"
          btnTitle="Connetti / Iscriviti"
        />
      </div>
      
      {/* Il resto della logica per il form e la dashboard rimane invariato */}
      {address ? (
        <div style={{ marginTop: '2rem' }}>
          {/* ... Qui va la logica per mostrare il form o la dashboard ... */}
        </div>
      ) : (
        <p style={{ textAlign: 'center', marginTop: '4rem' }}>Connettiti per iniziare.</p>
      )}
    </div>
  );
}

// Nota: per brevità, ho omesso i componenti RegistrationForm e ActiveUserDashboard
// che rimangono identici a prima. Devi solo assicurarti che l'h1 sia cambiato.
