// FILE: src/pages/AziendaPage.tsx
// VERSIONE FINALE E CORRETTA PER POLYGON CON SDK v5 E SMART ACCOUNT ATTIVO

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall, readContract } from 'thirdweb';
import { polygon } from 'thirdweb/chains'; // MODIFICA: Importiamo Polygon
import { inAppWallet } from 'thirdweb/wallets';
import { supplyChainABI as abi } from '../abi/contractABI';
import '../App.css';
import TransactionStatusModal from '../components/TransactionStatusModal';

// --- CONFIGURAZIONE PER POLYGON CON SDK v5 ---
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });

const contract = getContract({
  client,
  chain: polygon, // MODIFICA: Usiamo la chain Polygon
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});


// --- COMPONENTI UI (Il tuo codice originale) ---
const AziendaPageStyles = () => ( <style>{`...`}</style> );
const RegistrationForm = () => ( <div className="card">...</div> );
interface BatchData { id: string; batchId: bigint; name: string; description: string; date: string; location: string; isClosed: boolean; }
const BatchRow = ({ batch, localId }: { batch: BatchData; localId: number }) => { /* ... */ };
const BatchTable = ({ batches, nameFilter, setNameFilter, locationFilter, setLocationFilter, statusFilter, setStatusFilter }: any) => { /* ... */ };
const DashboardHeader = ({ contributorInfo, onNewInscriptionClick }: { contributorInfo: readonly [string, bigint, boolean], onNewInscriptionClick: () => void }) => { /* ... */ };
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

    // FUNZIONI
    const fetchAllBatches = async () => {
        if (!account?.address) return;
        setIsLoadingBatches(true);
        try {
            const batchIds = await readContract({ contract, abi, method: "function getBatchesByContributor(address) view returns (uint256[])", params: [account.address] }) as bigint[];
            const batchDataPromises = batchIds.map(id => readContract({ contract, abi, method: "function getBatchInfo(uint256) view returns (uint256,address,string,string,string,string,string,string,bool)", params: [id] }).then(info => ({ id: id.toString(), batchId: id, name: info[3], description: info[4], date: info[5], location: info[6], isClosed: info[8] })));
            const results = await Promise.all(batchDataPromises);
            setAllBatches(results.sort((a, b) => Number(b.batchId) - Number(a.batchId)));
        } catch (error) { console.error("Errore nel caricare i lotti:", error); setAllBatches([]); } 
        finally { setIsLoadingBatches(false); }
    };

    // FIX INFINITE LOOP: Questa logica è corretta e compatibile con v5
    useEffect(() => {
        if (account?.address) {
            refetchContributorInfo();
            fetchAllBatches();
        } else if (!account && prevAccountRef.current) {
            window.location.href = '/';
        }
        prevAccountRef.current = account?.address;
    }, [account]);

    useEffect(() => {
        let tempBatches = [...allBatches];
        if (nameFilter) tempBatches = tempBatches.filter(b => b.name.toLowerCase().includes(nameFilter.toLowerCase()));
        if (locationFilter) tempBatches = tempBatches.filter(b => b.location.toLowerCase().includes(locationFilter.toLowerCase()));
        if (statusFilter !== 'all') { const isOpen = statusFilter === 'open'; tempBatches = tempBatches.filter(b => !b.isClosed === isOpen); }
        setFilteredBatches(tempBatches);
    }, [nameFilter, locationFilter, statusFilter, allBatches]);
    
    const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setFormData(prev => ({...prev, [e.target.name]: e.target.value})); };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { setSelectedFile(e.target.files?.[0] || null); };
    
    const handleInitializeBatch = async () => {
        if (!formData.name.trim()) { setTxResult({ status: 'error', message: 'Il campo Nome è obbligatorio.' }); return; }
        setLoadingMessage('Preparazione transazione...');
        let imageIpfsHash = "N/A";
        if (selectedFile) { /* ... logica di upload file ... */ }
        setLoadingMessage('Transazione in corso...');
        const transaction = prepareContractCall({ contract, abi, method: "function initializeBatch(string,string,string,string,string)", params: [formData.name, formData.description, formData.date, formData.location, imageIpfsHash] });
        sendTransaction(transaction, { 
            onSuccess: async () => { setTxResult({ status: 'success', message: 'Iscrizione creata con successo!' }); await Promise.all([fetchAllBatches(), refetchContributorInfo()]); setLoadingMessage(''); },
            onError: (err) => { setTxResult({ status: 'error', message: err.message.toLowerCase().includes("insufficient funds") ? "Crediti Insufficienti, Ricarica" : "Errore nella transazione." }); setLoadingMessage(''); } 
        });
    };
    
    const openModal = () => { setFormData(getInitialFormData()); setSelectedFile(null); setCurrentStep(1); setTxResult(null); setModal('init'); };
    const handleCloseModal = () => setModal(null);
    const handleNextStep = () => { if (currentStep === 1 && !formData.name.trim()) { alert("Il campo 'Nome Iscrizione' è obbligatorio."); return; } if (currentStep < 6) setCurrentStep(prev => prev + 1); };
    const handlePrevStep = () => { if (currentStep > 1) setCurrentStep(prev => prev - 1); };
    
    // RENDER
    if (!account) {
        return (
            <div className='login-container'>
                <AziendaPageStyles />
                {/* SMART ACCOUNT RIATTIVATO (ora funzionante con SDK v5 su Polygon) */}
                <ConnectButton
                    client={client}
                    chain={polygon}
                    accountAbstraction={{
                        chain: polygon,
                        sponsorGas: true,
                    }}
                    wallets={[inAppWallet()]}
                    connectButton={{ label: "Connettiti / Log In", style: { fontSize: '1.2rem', padding: '1rem 2rem' } }}
                />
            </div>
        );
    }
    
    const renderDashboardContent = () => { 
        if (isStatusLoading) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica stato account...</p>; 
        if (isError || !contributorData) return <p style={{textAlign: 'center', marginTop: '4rem', color: 'red'}}>Errore nel recuperare i dati dell'account. Riprova.</p>
        if (!contributorData[2]) return <RegistrationForm />; 
        return (
            <> 
                <DashboardHeader contributorInfo={contributorData} onNewInscriptionClick={openModal} /> 
                {isLoadingBatches ? <p style={{textAlign: 'center', marginTop: '2rem'}}>Caricamento iscrizioni...</p> : <BatchTable batches={filteredBatches} nameFilter={nameFilter} setNameFilter={setNameFilter} locationFilter={locationFilter} setLocationFilter={setLocationFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter}/>} 
            </>
        ); 
    };
    
    const isProcessing = loadingMessage !== '' || isPending;
    const today = new Date().toISOString().split('T')[0];
    const helpTextStyle = { backgroundColor: '#343a40', border: '1px solid #495057', borderRadius: '8px', padding: '16px', marginTop: '16px', fontSize: '0.9rem', color: '#f8f9fa' };

    return (
        <div className="app-container-full">
            <AziendaPageStyles />
            <header className="main-header-bar">
                <div className="header-title">EasyChain - Area Riservata</div>
                <div className="wallet-button-container">
                    <ConnectButton
                        client={client}
                        chain={polygon}
                        detailsModal={{ hideSend: true, hideReceive: true, hideBuy: true, hideTransactionHistory: true }}
                    />
                </div>
            </header>
            <main className="main-content-full">{renderDashboardContent()}</main>
            
            {modal === 'init' && ( 
                <div className="modal-overlay" onClick={handleCloseModal}>
                    { /* ... Il tuo codice del modale ... */ }
                </div> 
            )}
            
            {isProcessing && <TransactionStatusModal status={'loading'} message={loadingMessage} onClose={() => {}} />}
            {txResult && <TransactionStatusModal status={txResult.status} message={txResult.message} onClose={() => { if (txResult.status === 'success') handleCloseModal(); setTxResult(null); }} />}
        </div>
    );
}