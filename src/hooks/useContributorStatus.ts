import { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { readContract, getContract } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { supplyChainABI as abi } from "../abi/contractABI";

const contract = getContract({
  client: { clientId: "e40dfd747fabedf48c5837fb79caf2eb" },
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302",
});

export function useContributorStatus() {
  const account = useActiveAccount();
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!account) {
        setIsActive(false);
        setIsLoading(false);
        return;
      }

      try {
        const data = await readContract({
          contract,
          abi,
          method: "getContributorInfo",
          params: [account.address],
        }) as [string, bigint, boolean];

        setIsActive(data[2]); // boolean
      } catch (error) {
        setIsActive(false); // se non è registrato
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [account]);

  return { isActive, isLoading };
}
