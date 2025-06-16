// FILE: src/pages/AdminPage.tsx
// Corretto l'import dell'ABI.

import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, readContract } from "thirdweb";
import { polygon } from "thirdweb/chains";
import React, { useState, useEffect } from "react";
import { supplyChainABI as abi } from "../abi/contractABI"; // <-- IMPORT CORRETTO
import "../App.css";

const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ client, chain: polygon, address: "0x4a866C3A071816E3186e18cbE99a3339f4571302" });

const AdminDashboard = () => { return <div>Contenuto Admin...</div>; };

export default function AdminPage() {
  const account = useActiveAccount();
  const [isAllowed, setIsAllowed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (account) {
        setIsLoading(true);
        try {
          const [superOwner, owner] = await Promise.all([
            readContract({ contract, abi, method: "superOwner" }),
            readContract({ contract, abi, method: "owner" })
          ]);
          setIsAllowed(account.address.toLowerCase() === superOwner.toLowerCase() || account.address.toLowerCase() === owner.toLowerCase());
        } catch (e) { setIsAllowed(false); }
        finally { setIsLoading(false); }
      } else { setIsLoading(false); }
    };
    checkPermissions();
  }, [account]);

  // ... (Il resto del codice di AdminPage rimane invariato)
}
