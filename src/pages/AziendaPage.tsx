import React, { useEffect, useState } from "react";
import {
  useAccount,
  useContract,
  useReadContract,
  ThirdwebProvider,
  ChainId,
} from "@thirdweb-dev/react";

const CONTRACT_ADDRESS = "0x..."; // metti qui il tuo indirizzo contratto
const ABI = [ /* copia e incolla qui tutta la ABI che hai fornito */ ];

function ContributorStatus() {
  const account = useAccount();
  const contract = useContract(CONTRACT_ADDRESS, ABI).contract;
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [credits, setCredits] = useState("0");
  const [name, setName] = useState("");

  useEffect(() => {
    const fetchContributorInfo = async () => {
      if (!account?.address || !contract) {
        setIsActive(false);
        setCredits("0");
        setName("");
        return;
      }

      setIsLoading(true);

      try {
        // getContributorInfo returns [string name, uint256 credits, bool isActive]
        const data = await contract.call("getContributorInfo", account.address);

        // Estraggo i dati dall'array ritornato
        const contributorName = data[0];
        const contributorCredits = data[1].toString();
        const contributorIsActive = data[2];

        setName(contributorName);
        setCredits(contributorCredits);
        setIsActive(contributorIsActive);
      } catch (error) {
        // Se fallisce, presumiamo non sia contributor
        setIsActive(false);
        setCredits("0");
        setName("");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContributorInfo();
  }, [account, contract]);

  if (isLoading) return <div>Caricamento informazioni...</div>;

  if (!account?.address) return <div>Devi connettere il wallet</div>;

  return (
    <div>
      {isActive ? (
        <div>
          <h2>Account attivo 🎉</h2>
          <p>Nome: {name}</p>
          <p>Crediti disponibili: {credits}</p>
        </div>
      ) : (
        <div>
          <h2>Account non attivo</h2>
          <p>Non risulti tra i contributor attivi.</p>
          {/* Qui puoi mettere il tuo componente di registrazione, es: <RegistrationForm /> */}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThirdwebProvider activeChain={ChainId.Goerli /* o mainnet, etc */}>
      <ContributorStatus />
    </ThirdwebProvider>
  );
}
