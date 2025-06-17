import React, { useState, useEffect } from 'react';
import {
  ConnectButton,
  useActiveAccount,
  useReadContract,
  useSendTransaction,
  readContract,
  useDisconnect,
} from 'thirdweb/react';
import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
} from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { inAppWallet } from 'thirdweb/wallets';
import { supplyChainABI as abi } from '../abi/contractABI';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const client = createThirdwebClient({ clientId: 'e40dfd747fabedf48c5837fb79caf2eb' });
const contract = getContract({ client, chain: polygon, address: '0x4a866C3A071816E3186e18cbE99a3339f4571302' });

export default function AziendaPage() {
  const account = useActiveAccount();
  const { disconnect } = useDisconnect();
  const { data: contributorData, isLoading: isStatusLoading } = useReadContract({
    contract,
    method: 'function getContributorInfo(address) view returns (string, uint256, bool)',
    params: account ? [account.address] : undefined,
    queryOptions: { enabled: !!account },
  });
  const { mutate: sendTransaction, isPending } = useSendTransaction();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ batchName: '', batchDescription: '' });
  const [allBatches, setAllBatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!account?.address) return;
    const fetchBatches = async () => {
      const batchIds = await readContract({
        contract,
        abi,
        method: 'function getBatchesByContributor(address _contributor) view returns (uint256[])',
        params: [account.address],
      });
      const results = await Promise.all(
        batchIds.map((id) =>
          readContract({
            contract,
            abi,
            method: 'function getBatchInfo(uint256) view returns (uint256, address, string, string, string, string, string, string, bool)',
            params: [id],
          })
        )
      );
      const enriched = results.map((r, i) => ({
        id: batchIds[i].toString(),
        name: r[3],
        description: r[4],
        date: r[5],
        location: r[6],
        isClosed: r[8],
      }));
      setAllBatches(enriched);
    };
    fetchBatches();
  }, [account?.address]);

  const handleLogout = () => account && disconnect(account.wallet);

  const handleCreate = () => {
    const tx = prepareContractCall({
      contract,
      abi,
      method: 'function initializeBatch(string, string, string, string, string)',
      params: [
        formData.batchName,
        formData.batchDescription,
        new Date().toLocaleDateString(),
        'Web App',
        'ipfs://...',
      ],
    });
    sendTransaction(tx, {
      onSuccess: () => {
        alert('✅ Iscrizione creata!');
        setModalOpen(false);
      },
      onError: (err) => alert(`❌ Errore: ${err.message}`),
    });
  };

  if (!account)
    return (
      <div className="flex h-screen items-center justify-center">
        <ConnectButton
          client={client}
          chain={polygon}
          accountAbstraction={{ chain: polygon, sponsorGas: true }}
          wallets={[inAppWallet()]}
          connectButton={{ label: 'Connettiti / Log In' }}
        />
      </div>
    );

  if (isStatusLoading) return <p className="text-center mt-10">Verifica stato account...</p>;

  const isActive = contributorData ? contributorData[2] : false;
  if (!isActive)
    return (
      <Card className="max-w-lg mx-auto mt-20 text-center">
        <CardHeader>
          <CardTitle>Benvenuto su Easy Chain!</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Il tuo account non è attivo. Compila il form di registrazione per inviare la richiesta di attivazione.</p>
        </CardContent>
      </Card>
    );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Dashboard Azienda</h1>
        <Button onClick={handleLogout}>Esci</Button>
      </div>

      <Card className="mb-6">
        <CardContent className="flex justify-between items-center">
          <div>
            <p className="text-lg font-bold">{contributorData[0]}</p>
            <p>Crediti: {contributorData[1].toString()}</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>Nuova Iscrizione</Button>
        </CardContent>
      </Card>

      <div className="mb-4">
        <Input
          placeholder="Filtra per nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allBatches
          .filter((b) => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((b) => (
            <Card key={b.id} className="p-4">
              <CardTitle className="mb-2">{b.name}</CardTitle>
              <p className="text-sm text-muted-foreground mb-1">{b.date} — {b.location}</p>
              <p className="mb-3 text-sm">{b.description}</p>
              <p className={`text-sm font-semibold ${b.isClosed ? 'text-green-600' : 'text-yellow-500'}`}>
                Stato: {b.isClosed ? 'Chiuso' : 'Aperto'}
              </p>
            </Card>
          ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Iscrizione</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nome Iscrizione"
              value={formData.batchName}
              onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
            />
            <Input
              placeholder="Descrizione"
              value={formData.batchDescription}
              onChange={(e) => setFormData({ ...formData, batchDescription: e.target.value })}
            />
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? 'Creazione...' : 'Conferma'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
