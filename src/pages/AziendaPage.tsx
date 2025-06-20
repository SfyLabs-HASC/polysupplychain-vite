// FILE: src/pages/AziendaPage.tsx

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
const moonbeamChain = defineChain(1284);
const contract = getContract({
  client,
  chain: moonbeamChain,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});

// --- COMPONENTI UI ---
const AziendaPageStyles = () => (
    <style>{`
        .debug-rpc-counter {
            position: fixed; top: 10px; left: 10px; background-color: #ffc107;
            color: #212529; padding: 5px 10px; border-radius: 5px;
            font-family: monospace; font-weight: bold; z-index: 9999; font-size: 14px;
        }
        /* ... resto del CSS ... */
    `}</style>
);
// ... altri componenti UI ...


// --- COMPONENTE PRINCIPALE ---
export default function AziendaPage() {
    const account = useActiveAccount();
    const { data: contributorData, isLoading: isStatusLoading, refetch: refetchContributorInfo, isError } = useReadContract({ contract, method: "function getContributorInfo(address) view returns (string, uint256, bool)", params: account ? [account.address] : undefined, queryOptions: { enabled: !!account } });
    const prevAccountRef = useRef(account?.address);
    const { mutate: sendTransaction, isPending } = useSendTransaction();

    // STATI
    const [modal, setModal] = useState<'init' | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "", date: "", location: "" });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [txResult, setTxResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
    const [allBatches, setAllBatches] = useState<any[]>([]);
    const [filteredBatches, setFilteredBatches] = useState<any[]>([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const [nameFilter, setNameFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [rpcCount, setRpcCount] = useState(0); // DEBUG: Stato contatore

    // FUNZIONI
    const fetchAllBatches = async () => {
        if (!account?.address) return;
        setIsLoadingBatches(true);
        try {
            setRpcCount(c => c + 1); // DEBUG: Incrementa
            const batchIds = await readContract({ contract, abi, method: "function getBatchesByContributor(address) view returns (uint256[])", params: [account.address] }) as bigint[];
            if (batchIds.length > 0) {
                setRpcCount(c => c + batchIds.length); // DEBUG: Incrementa
                const batchDataPromises = batchIds.map(id => readContract({ contract, abi, method: "function getBatchInfo(uint256) view returns (uint256,address,string,string,string,string,string,string,bool)", params: [id] }).then(info => ({ id: id.toString(), batchId: id, name: info[3], description: info[4], date: info[5], location: info[6], isClosed: info[8] })));
                const results = await Promise.all(batchDataPromises);
                setAllBatches(results.sort((a, b) => Number(b.batchId) - Number(a.batchId)));
            } else { setAllBatches([]); }
        } catch (error) { console.error("Errore nel caricare i lotti:", error); setAllBatches([]);
        } finally { setIsLoadingBatches(false); }
    };

    // CORREZIONE INFINITE LOOP: L'effetto ora dipende solo da 'account'
    useEffect(() => {
        if (account?.address) {
            setRpcCount(1); // DEBUG: Resetta e conta la prima chiamata
            refetchContributorInfo();
            fetchAllBatches();
        } else if (!account && prevAccountRef.current) {
            window.location.href = '/';
        }
        prevAccountRef.current = account?.address;
    }, [account]);

    // ... resto del codice (useEffect dei filtri, funzioni modale, etc.) ...
    
    // RENDER
    return (
        <div className="app-container-full">
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
                {/* ... Contenuto principale e logica di rendering ... */}
            </main>
        </div>
    );
}

// Nota: Alcune parti dei componenti sono state abbreviate in questa visualizzazione per chiarezza,
// ma il codice fornito è basato sulle versioni complete che abbiamo discusso.