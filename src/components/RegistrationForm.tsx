import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { getContract, writeContract } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { supplyChainABI as abi } from "../abi/contractABI";

const contract = getContract({
  client: { clientId: "e40dfd747fabedf48c5837fb79caf2eb" },
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302",
});

export default function RegistrationForm() {
  const account = useActiveAccount();
  const [companyName, setCompanyName] = useState("");

  const register = async () => {
    if (!companyName || !account) return;
    try {
      await writeContract({
        contract,
        method: "registerAsContributor",
        params: [companyName],
      });
      alert("✅ Registrazione inviata con successo!");
    } catch (e) {
      alert("❌ Errore nella registrazione.");
    }
  };

  return (
    <div>
      <h3>Registrazione azienda</h3>
      <input
        type="text"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder="Nome Azienda"
      />
      <button onClick={register}>Invia Registrazione</button>
    </div>
  );
}
