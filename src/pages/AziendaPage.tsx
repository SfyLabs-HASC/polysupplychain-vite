// FILE: src/pages/AziendaPage.tsx
// VERSIONE FINALE E CORRETTA CON TUTTE LE MODIFICHE

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall, readContract, defineChain } from 'thirdweb';
import { inAppWallet } from 'thirdweb/wallets';
import { supplyChainABI as abi } from '../abi/contractABI';
import '../App.css';
import TransactionStatusModal from '../components/TransactionStatusModal';

// 1. CONFIGURAZIONE UNIFICATA E STANDARD
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });

// Si usa UNA SOLA definizione di chain per Moonbeam (ID 1284)
const moonbeamChain = defineChain(1284);

const contract = getContract({
  client,
  chain: moonbeamChain,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});

// --- COMPONENTI UI ---
const AziendaPageStyles = () => (
    <style>{`
        /* DEBUG: Stile per il contatore RPC */
        .debug-rpc-counter {
            position: fixed;
            top: 10px;
            left: 10px;
            background-color: #ffc107;
            color: #212529;
            padding: 5px 10px;
            border-radius: 5px;
            font-family: monospace;
            font-weight: bold;
            z-index: 9999;
            font-size: 14px;
        }
        /* ... resto del CSS ... */
    `}</style>
);

const RegistrationForm = () => ( <div className="card"><h3>Benvenuto su Easy Chain!</h3><p>Il tuo account non è ancora attivo. Compila il form di registrazione per inviare una richiesta di attivazione.</p></div> );
interface BatchData { id: string; batchId: bigint; name: string; description: string; date: string; location: string; isClosed: boolean; }

const BatchRow = ({ batch, localId }: { batch: BatchData; localId: number }) => {
    const { data: stepCount } = useReadContract({ contract, method: "function getBatchStepCount(uint256)", params: [batch.batchId] });
    // ... resto del componente BatchRow
};

const BatchTable = ({ batches, nameFilter, setNameFilter, locationFilter, setLocationFilter, statusFilter, setStatusFilter }: any) => {
    // ... componente BatchTable
};

const DashboardHeader = ({ contributorInfo, onNewInscriptionClick }: { contributorInfo: readonly [string, bigint, boolean], onNewInscriptionClick: () => void }) => {
    // ... componente DashboardHeader
};

const getInitialFormData = () => ({ name: "", description: "", date: "", location: "" });
const truncateText = (text: string, maxLength: number) => text.length > maxLength ? text.substring(0, maxLength) + "..." : text;


// --- COMPONENTE PRINCIPALE ---
export default function AziendaPage() {
    const account = useActiveAccount();
    const { data: contributorData, isLoading: isStatusLoading, refetch: refetchContributorInfo, isError } = useReadContract({ contract, method: "function getContributorInfo(address) view returns (string, uint256, bool)", params: account ? [account.address] : undefined, queryOptions: { enabled: !!account } });
    const prevAccountRef = useRef(account?.address);
    const { mutate: sendTransaction, isPending } = useSendTransaction();

    // STATI
    const [modal, setModal] = useState<'init' | null>(null);
    const [formData, setFormData] = useState(getInitialFormData());
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [txResult, setTxResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
    const [allBatches, setAllBatches] = useState<BatchData[]>([]);
    const [filteredBatches, setFilteredBatches] = useState<BatchData[]>([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const [nameFilter, setNameFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // DEBUG: Stato per il contatore RPC
    const [rpcCount, setRpcCount] = useState(0);

    // FUNZIONI
    const fetchAllBatches = async () => {
        if (!account?.address) return;
        setIsLoadingBatches(true);
        try {
            // DEBUG: Incrementa per la chiamata che ottiene gli ID
            setRpcCount(c => c + 1);
            const batchIds = await readContract({ contract, abi, method: "function getBatchesByContributor(address) view returns (uint256[])", params: [account.address] }) as bigint[];
            
            if (batchIds.length > 0) {
                // DEBUG: Incrementa in un colpo solo per tutte le chiamate successive
                setRpcCount(c => c + batchIds.length);
                const batchDataPromises = batchIds.map(id => readContract({ contract, abi, method: "function getBatchInfo(uint256) view returns (uint256,address,string,string,string,string,string,string,bool)", params: [id] }).then(info => ({ id: id.toString(), batchId: id, name: info[3], description: info[4], date: info[5], location: info[6], isClosed: info[8] })));
                const results = await Promise.all(batchDataPromises);
                setAllBatches(results.sort((a, b) => Number(b.batchId) - Number(a.batchId)));
            } else {
                setAllBatches([]);
            }
        } catch (error) { console.error("Errore nel caricare i lotti:", error); setAllBatches([]);
        } finally { setIsLoadingBatches(false); }
    };

    // CORREZIONE INFINITE LOOP: L'effetto dipende solo da 'account'
    useEffect(() => {
        if (account?.address) {
            // DEBUG: Incrementa per la chiamata di refetch
            setRpcCount(c => c + 1);
            refetchContributorInfo();
            fetchAllBatches();
        } else if (!account && prevAccountRef.current) {
            window.location.href = '/';
        }
        prevAccountRef.current = account?.address;
    }, [account]);

    // useEffect per i filtri (invariato)
    useEffect(() => {
        let tempBatches = [...allBatches];
        if (nameFilter) tempBatches = tempBatches.filter(b => b.name.toLowerCase().includes(nameFilter.toLowerCase()));
        if (locationFilter) tempBatches = tempBatches.filter(b => b.location.toLowerCase().includes(locationFilter.toLowerCase()));
        if (statusFilter !== 'all') { const isOpen = statusFilter === 'open'; tempBatches = tempBatches.filter(b => !b.isClosed === isOpen); }
        setFilteredBatches(tempBatches);
    }, [nameFilter, locationFilter, statusFilter, allBatches]);

    const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => setSelectedFile(e.target.files?.[0] || null);

    const handleInitializeBatch = async () => {
        // ... Logica di validazione e upload file
        setLoadingMessage('Transazione in corso...');
        // DEBUG: Incrementa per la transazione di scrittura
        setRpcCount(c => c + 1);
        const transaction = prepareContractCall({ contract, abi, method: "function initializeBatch(string,string,string,string,string)", params: [formData.name, formData.description, formData.date, formData.location, "N/A"] }); // Sostituire "N/A" con imageIpfsHash se l'upload è implementato
        sendTransaction(transaction, {
            onSuccess: async () => {
                setTxResult({ status: 'success', message: 'Iscrizione creata con successo!' });
                setRpcCount(0); // Resetta il contatore per un nuovo ciclo
                await Promise.all([fetchAllBatches(), refetchContributorInfo()]);
                setLoadingMessage('');
            },
            onError: (err) => {
                setTxResult({ status: 'error', message: err.message.toLowerCase().includes("insufficient funds") ? "Crediti Insufficienti, Ricarica" : "Errore nella transazione." });
                setLoadingMessage('');
            }
        });
    };

    const openModal = () => { /* ... */ };
    const handleCloseModal = () => { /* ... */ };
    const handleNextStep = () => { /* ... */ };
    const handlePrevStep = () => { /* ... */ };

    // RENDER
    if (!account) {
        return (
            <div className='login-container'>
                <AziendaPageStyles />
                <ConnectButton
                    client={client}
                    chain={moonbeamChain}
                    accountAbstraction={{ chain: moonbeamChain, sponsorGas: true }}
                    wallets={[inAppWallet()]}
                    connectButton={{ label: "Connettiti / Log In", style: { fontSize: '1.2rem', padding: '1rem 2rem' } }}
                />
            </div>
        );
    }
    
    const renderDashboardContent = () => {
        // ... logica di rendering dashboard
    };

    return (
        <div className="app-container-full">
            {/* DEBUG: Visualizza il contatore */}
            <div className="debug-rpc-counter">RPC Calls: {rpcCount}</div>

            <AziendaPageStyles />
            <header className="main-header-bar">
                <div className="header-title">EasyChain - Area Riservata</div>
                <div className="wallet-button-container">
                    <ConnectButton
                        client={client}
                        chain={moonbeamChain}
                        detailsModal={{ hideSend: true, hideReceive: true, hideBuy: true, hideTransactionHistory: true }}
                    />
                </div>
            </header>
            <main className="main-content-full">
                {/* ... contenuto principale ... */}
            </main>
            
            {/* ... modale e status ... */}
        </div>
    );
}

// Nota: il codice di alcuni componenti interni è stato omesso per brevità in questa visualizzazione,
// ma il file originale che ti ho fornito precedentemente è completo. Assicurati di avere le versioni complete.