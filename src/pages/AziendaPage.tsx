// FILE: src/pages/AziendaPage.tsx
// Corretto l'import dell'ABI.

import React, { useState, useEffect } from "react";
import { ConnectButton, TransactionButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, readContract, prepareContractCall } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { supplyChainABI as abi } from "../abi/contractABI"; // <-- IMPORT CORRETTO
import "../App.css";

const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ client, chain: polygon, address: "0x4a866C3A071816E3186e18cbE99a3339f4571302" });

const RegistrationForm = () => { return <div className="card"><h3>Form Registrazione</h3></div>; };
const ActiveUserDashboard = () => { /* ... Il resto del codice qui ... */ };

export default function AziendaPage() {
  const account = useActiveAccount();
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (account) {
        setIsLoading(true);
        try {
          const data = await readContract({ contract, abi, method: "getContributorInfo", params: [account.address] });
          setIsActive(data[2]);
        } catch (e) { setIsActive(false); }
        finally { setIsLoading(false); }
      } else { setIsLoading(false); }
    };
    checkStatus();
  }, [account]);

  // ... (Il resto del codice di AziendaPage rimane invariato)
}
