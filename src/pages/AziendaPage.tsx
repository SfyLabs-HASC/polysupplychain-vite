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

// UI Components from shadcn/ui
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


// Icons from lucide-react
import { LogOut, PlusCircle, Search, Calendar, MapPin, CheckCircle2, AlertCircle, ShieldAlert, Loader2, CircleDollarSign, User, LayoutDashboard } from 'lucide-react';


// --- Configurazione Thirdweb (invariata) ---
const client = createThirdwebClient({ clientId: 'e40dfd747fabedf48c5837fb79caf2eb' });
const contract = getContract({ client, chain: polygon, address: '0x4a866C3A071816E3186e18cbE99a3339f4571302' });


// --- Componenti UI Suddivisi ---

/**
 * Componente per la card di una singola iscrizione (Batch)
 */
const BatchCard = ({ batch }) => (
  <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        {batch.name}
        <Badge variant={batch.isClosed ? 'outline' : 'default'} className={`text-xs ${batch.isClosed ? 'border-green-600 text-green-600' : 'bg-yellow-500 text-white'}`}>
          {batch.isClosed ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <AlertCircle className="mr-1 h-3 w-3" />}
          {batch.isClosed ? 'Chiuso' : 'Aperto'}
        </Badge>
      </CardTitle>
      <CardDescription className="flex items-center text-sm text-muted-foreground pt-2">
        <Calendar className="mr-2 h-4 w-4" /> {batch.date}
        <span className="mx-2">|</span>
        <MapPin className="mr-2 h-4 w-4" /> {batch.location}
      </CardDescription>
    </CardHeader>
    <CardContent className="flex-grow">
      <p className="text-sm">{batch.description}</p>
    </CardContent>
    <CardFooter>
        <p className="text-xs text-muted-foreground">ID: {batch.id}</p>
    </CardFooter>
  </Card>
);

/**
 * Componente per il Dialog di creazione di una nuova iscrizione
 */
const CreateBatchDialog = ({ open, onOpenChange, onCreate, isPending }) => {
  const [formData, setFormData] = useState({ batchName: '', batchDescription: '' });

  const handleCreateClick = () => {
    onCreate(formData);
    // Resetta il form dopo la creazione
    setFormData({ batchName: '', batchDescription: '' });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crea Nuova Iscrizione</DialogTitle>
          <DialogDescription>
            Inserisci i dettagli per la nuova iscrizione. Verrà registrata sulla blockchain.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="batchName">Nome Iscrizione</Label>
            <Input
              id="batchName"
              placeholder="Es. Raccolta Olive 2024"
              value={formData.batchName}
              onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="batchDescription">Descrizione</Label>
            <Input
              id="batchDescription"
              placeholder="Dettagli sulla raccolta..."
              value={formData.batchDescription}
              onChange={(e) => setFormData({ ...formData, batchDescription: e.target.value })}
            />
          </div>
        </div>
        <Button onClick={handleCreateClick} disabled={isPending || !formData.batchName}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creazione in corso...
            </>
          ) : (
            'Conferma e Crea'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};


// --- Componente Pagina Principale ---

export default function AziendaPage() {
  const account = useActiveAccount();
  const { disconnect } = useDisconnect();

  // --- State Management ---
  const [allBatches, setAllBatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  
  // --- Thirdweb Hooks ---
  const { mutate: sendTransaction, isPending } = useSendTransaction();
  const { data: contributorData, isLoading: isStatusLoading } = useReadContract({
    contract,
    method: 'function getContributorInfo(address) view returns (string, uint256, bool)',
    params: account ? [account.address] : undefined,
    queryOptions: { enabled: !!account },
  });

  // Destrutturazione più leggibile dei dati del contributor
  const [contributorName, contributorCredits, isAccountActive] = contributorData 
    ? [contributorData[0], contributorData[1].toString(), contributorData[2]] 
    : ['', '0', false];

  // --- Data Fetching Effect ---
  useEffect(() => {
    if (!account?.address || !isAccountActive) return;

    const fetchBatches = async () => {
      try {
        const batchIds = await readContract({
          contract,
          method: 'function getBatchesByContributor(address _contributor) view returns (uint256[])',
          params: [account.address],
        });

        const batchPromises = batchIds.map((id) =>
          readContract({
            contract,
            method: 'function getBatchInfo(uint256) view returns (uint256, address, string, string, string, string, string, string, bool)',
            params: [id],
          })
        );
        
        const results = await Promise.all(batchPromises);

        const enrichedBatches = results.map((result, i) => {
          // Destrutturazione dei risultati della chiamata per maggior leggibilità
          const [id, owner, type, name, description, date, location, ipfsHash, isClosed] = result;
          return {
            id: batchIds[i].toString(),
            name,
            description,
            date,
            location,
            isClosed,
          };
        });

        setAllBatches(enrichedBatches.reverse()); // Mostra i più recenti prima
      } catch (error) {
        console.error("Failed to fetch batches:", error);
        // Potresti impostare uno stato di errore qui per mostrarlo nell'UI
      }
    };

    fetchBatches();
  }, [account?.address, isAccountActive]);

  // --- Handlers ---
  const handleLogout = () => account && disconnect(account.wallet);

  const handleCreateBatch = (formData) => {
    if (!formData.batchName || !formData.batchDescription) {
        alert('❌ Nome e descrizione sono obbligatori.');
        return;
    }
      
    const tx = prepareContractCall({
      contract,
      method: 'function initializeBatch(string, string, string, string, string)',
      params: [
        formData.batchName,
        formData.batchDescription,
        new Date().toLocaleDateString('it-IT'), // Formato data italiano
        'Web App',
        'ipfs://...', // Placeholder
      ],
    });

    sendTransaction(tx, {
      onSuccess: () => {
        alert('✅ Iscrizione creata con successo!');
        setModalOpen(false);
        // Qui potresti ri-eseguire il fetch dei batches per aggiornare la lista
      },
      onError: (err) => alert(`❌ Errore durante la creazione: ${err.message}`),
    });
  };

  const filteredBatches = allBatches.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Viste Condizionali ---

  if (!account) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <ConnectButton
          client={client}
          chain={polygon}
          accountAbstraction={{ chain: polygon, sponsorGas: true }}
          wallets={[inAppWallet()]}
          connectButton={{ label: 'Connettiti / Registrati' }}
        />
      </div>
    );
  }
  
  if (isStatusLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="mr-2 h-16 w-16 animate-spin text-blue-600" />
            <p className="text-lg text-muted-foreground">Verifica stato account...</p>
        </div>
    );
  }

  if (!isAccountActive) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Card className="max-w-lg text-center shadow-lg">
          <CardHeader>
            <div className="mx-auto bg-yellow-100 rounded-full p-3 w-fit">
               <ShieldAlert className="h-10 w-10 text-yellow-500" />
            </div>
            <CardTitle className="pt-4">Account in Attesa di Attivazione</CardTitle>
            <CardDescription>Benvenuto su Easy Chain!</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Il tuo account è stato creato ma non è ancora attivo. Compila il form di registrazione per inviare la richiesta di attivazione all'amministratore.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
             <Button onClick={handleLogout}>Esci</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // --- Vista Principale (Dashboard) ---
  return (
    <TooltipProvider>
    <div className="bg-slate-50 min-h-screen">
      <header className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
                <div className="flex items-center gap-3">
                    <LayoutDashboard className="h-6 w-6 text-blue-600"/>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard Azienda</h1>
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={handleLogout}>
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Esci</p>
                    </TooltipContent>
                </Tooltip>
            </div>
          </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <Card className="mb-8 shadow-sm">
            <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-muted-foreground"/>
                        <p className="text-xl font-semibold text-slate-800">{contributorName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <CircleDollarSign className="h-5 w-5 text-muted-foreground"/>
                        <p className="text-md text-slate-600">Crediti Disponibili: <strong>{contributorCredits}</strong></p>
                    </div>
                </div>
                <Button onClick={() => setModalOpen(true)}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Nuova Iscrizione
                </Button>
            </CardContent>
        </Card>

        {/* Filter and Batch List */}
        <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                placeholder="Filtra iscrizioni per nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
            />
        </div>
        
        {filteredBatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBatches.map((batch) => (
                    <BatchCard key={batch.id} batch={batch} />
                ))}
            </div>
        ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold text-slate-700">Nessuna Iscrizione Trovata</h3>
                <p className="text-muted-foreground mt-2">
                    {searchTerm ? "Prova a modificare i termini di ricerca." : "Crea la tua prima iscrizione per iniziare."}
                </p>
            </div>
        )}
      </main>

      {/* Modal Dialog */}
      <CreateBatchDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreate={handleCreateBatch}
        isPending={isPending}
      />
    </div>
    </TooltipProvider>
  );
}