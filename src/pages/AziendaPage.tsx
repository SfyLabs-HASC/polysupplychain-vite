// FILE: src/pages/AziendaPage.tsx
// Versione finale con login solo social, account abstraction, e sintassi V5 corretta.

import React, { useState, useEffect } from "react";
import { ConnectButton, TransactionButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, readContract, prepareContractCall } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets"; // Importazione corretta per V5
import { abi } from "../abi/SupplyChainV2.json";
import "../App.css";

const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ client, chain: polygon, address: "0x4a866C3A071816E3186e18cbE99a3339f4571302" });

const RegistrationForm = () => { /* Il tuo codice del form di registrazione va qui */ return <div className="card"><h3>Form Registrazione</h3></div>; };
const ActiveUserDashboard = () => {
  return (
    <div className="card">
      <h3 style={{color: '#34d399'}}>✅ ACCOUNT ATTIVATO</h3>
      <p>Benvenuto! Crea un batch di prova. Il gas sarà sponsorizzato.</p>
      <TransactionButton
        transaction={() => prepareContractCall({
          contract,
          method: "initializeBatch",
          params: ["Lotto Prova V5", "Creato con AA!", new Date().toLocaleDateString(), "Web App V5", "ipfs://..."]
        })}
        onTransactionConfirmed={() => alert("✅ Batch creato!")}
        onError={(error) => alert(`❌ Errore: ${error.message}`)}
        className="web3-button"
      >
        Crea Batch (Gasless)
      </TransactionButton>
    </div>
  );
};

export default function AziendaPage() {
  const account = useActiveAccount();
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (account) {
        setIsLoading(true);
        try {
          const data = await readContract({ contract, method: `function getContributorInfo(address) returns (tuple(string name, uint256 credits, bool isActive))`, params: [account.address] });
          setIsActive(data.isActive);
        } catch (e) {
          setIsActive(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    checkStatus();
  }, [account]);

  const renderContent = () => {
    if (!account) return <p>Connettiti per iniziare.</p>;
    if (isLoading) return <p>Verifica stato...</p>;
    return isActive ? <ActiveUserDashboard /> : <RegistrationForm />;
  };

  return (
    <div className="app-container">
      <aside className="sidebar"><h1 className="sidebar-title">Easy Chain</h1>{account && <div className="user-info"><p><strong>Wallet:</strong></p><p>{account.address}</p></div>}</aside>
      <main className="main-content">
        <header className="header">
          <ConnectButton
            client={client}
            // CORREZIONE: Limitiamo i wallet mostrati
            wallets={[inAppWallet()]} 
            accountAbstraction={{ chain: polygon, sponsorGas: true }}
            appMetadata={{ name: "Easy Chain", url: "https://easychain.com" }}
          />
        </header>
        <h2 className="page-title">Portale Aziende</h2>
        {renderContent()}
      </main>
    </div>
  );
}
