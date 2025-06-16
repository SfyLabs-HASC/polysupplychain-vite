// FILE: src/pages/AziendaPage.tsx
// Portale aziende con login solo social.

import React, { useState, useEffect } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, readContract } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";
import { abi } from "../abi/SupplyChainV2.json";
import "../App.css";

const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ client, chain: polygon, address: "0x4a866C3A071816E3186e18cbE99a3339f4571302" });

const RegistrationForm = () => { /* Il tuo codice del form di registrazione va qui */ return <div className="card"><h3>Form Registrazione</h3></div>; };
const ActiveUserDashboard = () => { /* La tua dashboard per utenti attivi va qui */ return <div className="card"><h3 style={{color: '#34d399'}}>✅ ACCOUNT ATTIVATO</h3></div>; };

export default function AziendaPage() {
  const account = useActiveAccount();
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (account) {
        setIsLoading(true);
        try {
          const data = await readContract({ contract, method: "getContributorInfo", params: [account.address] });
          setIsActive(data.isActive);
        } catch (e) { setIsActive(false); }
        finally { setIsLoading(false); }
      } else { setIsLoading(false); }
    };
    checkStatus();
  }, [account]);

  const renderContent = () => {
    if (!account) return <p style={{textAlign: 'center'}}>Connettiti per iniziare.</p>;
    if (isLoading) return <p style={{textAlign: 'center'}}>Verifica stato...</p>;
    return isActive ? <ActiveUserDashboard /> : <RegistrationForm />;
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h1 className="sidebar-title">Easy Chain</h1>
        {account && <div className="user-info"><p><strong>Wallet:</strong></p><p>{account.address}</p></div>}
      </aside>
      <main className="main-content">
        <header className="header">
          <ConnectButton
            client={client}
            wallets={[
              inAppWallet({
                auth: {
                  options: ["email", "google", "apple", "facebook"],
                },
              }),
            ]}
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
