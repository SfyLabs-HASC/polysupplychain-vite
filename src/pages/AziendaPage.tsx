import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall, readContract } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { inAppWallet } from 'thirdweb/wallets';
import { supplyChainABI as abi } from '../abi/contractABI';
import '../App.css';
import TransactionStatusModal from '../components/TransactionStatusModal';

// --- 1. CONFIGURAZIONE CLIENT E RETI (MODIFICATA) ---
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });

// 1A. Definiamo la chain per la connessione con Smart Account.
// Lasciamo che Thirdweb usi il suo RPC di default per la massima compatibilità
// con il suo bundler e paymaster (sponsor del gas).
const moonbeamForSmartAccount = defineChain(1284);

// 1B. Definiamo la chain per le interazioni con il nostro contratto.
// Qui usiamo l'RPC di 1rpc.io per privacy e performance.
const moonbeamForContract = defineChain({
  id: 1284,
  rpc: "https://1rpc.io/glmr",
});

// 2. Creiamo l'oggetto contratto usando la definizione con l'RPC di 1rpc.io.
const contract = getContract({
  client,
  chain: moonbeamForContract, // <-- Usiamo questo per leggere e scrivere
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});

// --- Inizio Componenti UI (invariati) ---
const AziendaPageStyles = () => ( <style>{`...`}</style> /* Stili CSS omessi per brevità */ );
const RegistrationForm = () => ( <div className="card">...</div> /* Codice omesso per brevità */ );
const BatchRow = ({ batch, localId }: { batch: BatchData; localId: number }) => { /* ... Codice omesso per brevità ... */ };
interface BatchData { id: string; batchId: bigint; name: string; description: string; date: string; location: string; isClosed: boolean; }
const BatchTable = ({ batches, nameFilter, setNameFilter, locationFilter, setLocationFilter, statusFilter, setStatusFilter }: any) => { /* ... Codice omesso per brevità ... */};
const DashboardHeader = ({ contributorInfo, onNewInscriptionClick }: { contributorInfo: readonly [string, bigint, boolean], onNewInscriptionClick: () => void }) => { /* ... Codice omesso per brevità ... */ };
const getInitialFormData = () => ({ name: "", description: "", date: "", location: "" });
const truncateText = (text: string, maxLength: number) => { /* ... Codice omesso per brevità ... */ };
// --- Fine Componenti UI ---


// --- COMPONENTE PRINCIPALE DELLA PAGINA ---
export default function AziendaPage() {
    const account = useActiveAccount();
    const { data: contributorData, isLoading: isStatusLoading, refetch: refetchContributorInfo, isError } = useReadContract({ contract, method: "function getContributorInfo(address) view returns (string, uint256, bool)", params: account ? [account.address] : undefined, queryOptions: { enabled: !!account } });
    const prevAccountRef = useRef(account?.address);
    const { mutate: sendTransaction, isPending } = useSendTransaction();
    const [modal, setModal] = useState<'init' | null>(null);
    const [formData, setFormData] = useState(getInitialFormData());
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [txResult, setTxResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
    const [allBatches, setAllBatches] = useState<BatchData[]>([]);
    const [filteredBatches, setFilteredBatches] = useState<BatchData[]>([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(true);
    // ... altri stati ...

    // ... funzioni fetchAllBatches, useEffect, handleModalInputChange, etc. (omesse per brevità) ...

    const fetchAllBatches = async () => { /* ... codice invariato ... */ };
    useEffect(() => { /* ... codice invariato ... */ }, [account, refetchContributorInfo]);
    useEffect(() => { /* ... codice invariato ... */ }, [nameFilter, locationFilter, statusFilter, allBatches]);
    const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { /* ... codice invariato ... */ };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... codice invariato ... */ };
    const handleInitializeBatch = async () => { /* ... codice invariato ... */ };
    const openModal = () => { /* ... codice invariato ... */ };
    const handleCloseModal = () => { /* ... codice invariato ... */ };
    const handleNextStep = () => { /* ... codice invariato ... */ };
    const handlePrevStep = () => { /* ... codice invariato ... */ };


    // --- 3. GESTIONE CONNESSIONE (MODIFICATA) ---
    // Se l'utente non è connesso, mostriamo il bottone di login.
    if (!account) {
        return (
            <div className='login-container'>
                <AziendaPageStyles />
                <ConnectButton
                    client={client}
                    // Usiamo la chain per lo Smart Account qui
                    chain={moonbeamForSmartAccount}
                    accountAbstraction={{
                        chain: moonbeamForSmartAccount, // e anche qui
                        sponsorGas: true
                    }}
                    wallets={[inAppWallet()]}
                    connectButton={{ label: "Connettiti / Log In", style: { fontSize: '1.2rem', padding: '1rem 2rem' } }}
                />
            </div>
        );
    }

    const renderDashboardContent = () => { /* ... codice invariato ... */ };
    const isProcessing = loadingMessage !== '' || isPending;
    const today = new Date().toISOString().split('T')[0];
    const helpTextStyle = { /* ... */ };

    return (
        <div className="app-container-full">
            <AziendaPageStyles />
            <header className="main-header-bar">
                <div className="header-title">EasyChain - Area Riservata</div>
                <div className="wallet-button-container">
                    {/* --- 4. BOTTONE HEADER (MODIFICATO) --- */}
                    <ConnectButton
                        client={client}
                        // Usiamo la chain per lo Smart Account anche qui per coerenza
                        chain={moonbeamForSmartAccount}
                        detailsModal={{ hideSend: true, hideReceive: true, hideBuy: true, hideTransactionHistory: true }}
                    />
                </div>
            </header>
            <main className="main-content-full">{renderDashboardContent()}</main>

            {modal === 'init' && (
                // ... codice del modale invariato ...
                <div className="modal-overlay" onClick={handleCloseModal}>...</div>
            )}
            
            {isProcessing && <TransactionStatusModal status={'loading'} message={loadingMessage} onClose={() => {}} />}
            {txResult && <TransactionStatusModal status={txResult.status} message={txResult.message} onClose={() => { if (txResult.status === 'success') handleCloseModal(); setTxResult(null); }} />}
        </div>
    );
}