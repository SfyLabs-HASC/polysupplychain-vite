// FILE: src/pages/AziendaPage.tsx
// VERSIONE FINALE CON POPUP DI NOTIFICA TRANSAZIONE

import React, { useState, useEffect } from 'react';
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction, useDisconnect } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall, readContract } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { inAppWallet } from 'thirdweb/wallets';
import { supplyChainABI as abi } from '../abi/contractABI';
import '../App.css'; 

// Importa il nuovo componente di notifica
import TransactionStatusModal from '../components/TransactionStatusModal';

// --- Configurazione e Componenti Helper (Invariati) ---
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ 
  client, 
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});

const RegistrationForm = () => ( <div className="card"><h3>Benvenuto su Easy Chain!</h3><p>Il tuo account non è ancora attivo. Compila il form di registrazione per inviare una richiesta di attivazione.</p></div> );
const BatchRow = ({ batchId, localId }: { batchId: bigint; localId: number }) => {
    const [showDescription, setShowDescription] = useState(false);
    const { data: batchInfo } = useReadContract({ contract, abi, method: "function getBatchInfo(uint256 _batchId) view returns (uint256,address,string,string,string,string,string,string,bool)", params: [batchId] });
    const { data: stepCount } = useReadContract({ contract, abi, method: "function getBatchStepCount(uint256 _batchId) view returns (uint256)", params: [batchId] });
    const name = batchInfo?.[3], description = batchInfo?.[4], dateRaw = batchInfo?.[5], location = batchInfo?.[6], isClosed = batchInfo?.[8];
    const formatDate = (dateStr: string | undefined) => !dateStr || dateStr.split('-').length !== 3 ? '/' : dateStr.split('-').reverse().join('/');
    return (<><tr><td>{localId}</td><td><span className="clickable-name" onClick={() => setShowDescription(true)}>{name || '/'}</span></td><td>{formatDate(dateRaw)}</td><td>{location || '/'}</td><td>{stepCount !== undefined ? stepCount.toString() : '/'}</td><td>{batchInfo ? (isClosed ? <span className="status-closed">✅ Chiuso</span> : <span className="status-open">⏳ Aperto</span>) : '...'}</td><td><button className="web3-button" onClick={() => alert('Pronto per il Passaggio 2!')}>Visualizza</button></td></tr>{showDescription && (<div className="modal-overlay" onClick={() => setShowDescription(false)}><div className="modal-content description-modal" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h2>Descrizione Iscrizione / Lotto</h2></div><div className="modal-body"><p>{description || 'Nessuna descrizione fornita.'}</p></div><div className="modal-footer"><button onClick={() => setShowDescription(false)} className="web3-button">Chiudi</button></div></div></div>)}</>);
};
interface BatchMetadata { id: string; batchId: bigint; name: string; }
const BatchTable = ({ batches }: { batches: (BatchMetadata & { localId: number })[] }) => {
    const [currentPage, setCurrentPage] = useState(1); const [itemsToShow, setItemsToShow] = useState(10); const MAX_PER_PAGE = 30; const totalPages = Math.max(1, Math.ceil(batches.length / MAX_PER_PAGE)); const startIndex = (currentPage - 1) * MAX_PER_PAGE; const itemsOnCurrentPage = batches.slice(startIndex, startIndex + MAX_PER_PAGE); const visibleBatches = itemsOnCurrentPage.slice(0, itemsToShow); useEffect(() => { setCurrentPage(1); setItemsToShow(10); }, [batches]); const handleLoadMore = () => setItemsToShow(prev => Math.min(prev + 10, MAX_PER_PAGE)); const handlePageChange = (page: number) => { if (page < 1 || page > totalPages) return; setCurrentPage(page); setItemsToShow(10); };
    return (<div className="table-container"><table className="company-table"><thead><tr><th>ID</th><th>Nome</th><th>Data</th><th>Luogo</th><th>N° Passaggi</th><th>Stato</th><th>Azione</th></tr></thead><tbody>{visibleBatches.length > 0 ? (visibleBatches.map(batch => <BatchRow key={batch.id} batchId={batch.batchId} localId={batch.localId} />)) : (<tr><td colSpan={7} style={{textAlign: 'center'}}>Nessuna iscrizione trovata.</td></tr>)}</tbody></table><div className="pagination-controls">{itemsToShow < itemsOnCurrentPage.length && (<button onClick={handleLoadMore} className='link-button'>Vedi altri 10...</button>)}<div className="page-selector">{totalPages > 1 && <> <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>&lt;</button> <span> Pagina {currentPage} di {totalPages} </span> <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>&gt;</button></>}</div></div></div>);
};
const DashboardHeader = ({ contributorInfo, onNewInscriptionClick }: { contributorInfo: readonly [string, bigint, boolean], onNewInscriptionClick: () => void }) => {
    const companyName = contributorInfo[0] || 'Azienda'; const credits = contributorInfo[1].toString();
    return (<div className="dashboard-header-card"><div className="welcome-section"><h1>Ciao, "{companyName}"</h1><button className="web3-button large" onClick={onNewInscriptionClick}>Nuova Iscrizione</button></div><div className="status-section"><div className="status-item"><span>Stato: <strong>ATTIVO</strong></span><span className="status-icon">✅</span></div><div className="status-item"><span>Crediti Rimanenti: <strong>{credits}</strong></span></div></div></div>);
};

// ==================================================================
// COMPONENTE PRINCIPALE EXPORTATO
// ==================================================================
export default function AziendaPage() {
    const account = useActiveAccount();
    const { disconnect } = useDisconnect();
    const { data: contributorData, isLoading: isStatusLoading, refetch: refetchContributorInfo } = useReadContract({ contract, method: "function getContributorInfo(address) view returns (string, uint256, bool)", params: account ? [account.address] : undefined, queryOptions: { enabled: !!account } });
    
    // isPending gestisce lo stato di caricamento della transazione
    const { mutate: sendTransaction, isPending } = useSendTransaction();
    
    const [modal, setModal] = useState<'init' | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "", date: new Date().toISOString().split('T')[0], location: "" });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // MODIFICA: Stato per gestire il risultato della transazione (successo/errore)
    const [txResult, setTxResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

    const [allBatches, setAllBatches] = useState<(BatchMetadata & { localId: number })[]>([]);
    const [filteredBatches, setFilteredBatches] = useState<(BatchMetadata & { localId: number })[]>([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const today = new Date().toISOString().split('T')[0];

    // Funzione per ricaricare i lotti, da chiamare dopo un'iscrizione
    const fetchAllBatches = async () => {
        if (!account?.address) return;
        setIsLoadingBatches(true);
        try {
            const batchIds = await readContract({ contract, abi, method: "function getBatchesByContributor(address) view returns (uint256[])", params: [account.address] }) as bigint[];
            const batchNamePromises = batchIds.map(id => readContract({ contract, abi, method: "function getBatchInfo(uint256) view returns (uint256,address,string,string,string,string,string,string,bool)", params: [id] }).then(info => ({id: id.toString(), batchId: id, name: info[3]})));
            const results = await Promise.all(batchNamePromises);
            const sortedByBatchId = results.sort((a, b) => a.batchId > b.batchId ? -1 : 1);
            const finalData = sortedByBatchId.map((batch, index) => ({ ...batch, localId: index + 1 }));
            setAllBatches(finalData);
        } catch (error) { console.error("Errore nel caricare i lotti:", error); } 
        finally { setIsLoadingBatches(false); }
    };

    useEffect(() => { fetchAllBatches(); }, [account?.address]);
    useEffect(() => { setFilteredBatches(searchTerm ? allBatches.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())) : allBatches); }, [searchTerm, allBatches]);

    const handleLogout = () => { if (account) disconnect(account.wallet); };
    const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const { name, value } = e.target; setFormData(prev => ({...prev, [name]: value})); };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => setSelectedFile(e.target.files?.[0] || null);

    const handleInitializeBatch = async () => {
        if (!formData.name.trim()) return alert("Il campo Nome è obbligatorio.");
        let imageIpfsHash = "N/A";
        setIsUploading(true);
        try {
            if (selectedFile) { /* ...logica upload... */ }
            setIsUploading(false);
            const transaction = prepareContractCall({ contract, abi, method: "function initializeBatch(string,string,string,string,string)", params: [formData.name, formData.description, formData.date, formData.location, imageIpfsHash] });
            
            // MODIFICA: Rimossi gli alert e usiamo lo stato per il popup
            sendTransaction(transaction, { 
                onSuccess: () => { 
                    setTxResult({ status: 'success', message: 'Iscrizione creata con successo!' });
                    fetchAllBatches(); // Ricarica la lista dei lotti
                    refetchContributorInfo(); // Ricarica i crediti
                },
                onError: (err) => {
                    const readableError = err.message.includes("insufficient funds") ? "Crediti insufficienti per completare l'operazione." : `Errore nella transazione.`;
                    setTxResult({ status: 'error', message: readableError });
                } 
            });
        } catch (error: any) {
            setIsUploading(false);
            setTxResult({ status: 'error', message: `Fallimento: ${error.message}` });
        }
    };
    
    // ... il resto del componente ...
    if (!account) { return <div className='login-container'><ConnectButton client={client} chain={polygon} accountAbstraction={{ chain: polygon, sponsorGas: true }} wallets={[inAppWallet()]} connectButton={{ label: "Connettiti / Log In", style: { fontSize: '1.2rem', padding: '1rem 2rem' } }} /></div>; }
    const renderDashboardContent = () => { if (isStatusLoading) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica stato account...</p>; const isActive = contributorData?.[2] ?? false; if (!isActive) return <RegistrationForm />; return (<> <DashboardHeader contributorInfo={contributorData!} onNewInscriptionClick={() => setModal('init')} /> <div className="search-bar-container"><input type="text" placeholder="Filtra iscrizioni per nome..." className="form-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div> {isLoadingBatches ? <p>Caricamento iscrizioni...</p> : <BatchTable batches={filteredBatches} />} </>); };
    return (
        <div className="app-container-full">
            <header className="main-header-bar"><button onClick={handleLogout} className='logout-button-top-right'>Log Out / Esci</button></header>
            <main className="main-content-full">{renderDashboardContent()}</main>

            {modal === 'init' && ( <div className="modal-overlay" onClick={() => setModal(null)}><div className="modal-content" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h2>Nuova Iscrizione</h2></div><div className="modal-body"><div className="form-group"><label>Nome Iscrizione *</label><input type="text" name="name" value={formData.name} onChange={handleModalInputChange} className="form-input" maxLength={50} /><small className="char-counter">{formData.name.length} / 50</small></div><div className="form-group"><label>Descrizione</label><textarea name="description" value={formData.description} onChange={handleModalInputChange} className="form-input" rows={4} maxLength={500}></textarea><small className="char-counter">{formData.description.length} / 500</small></div><div className="form-group"><label>Luogo</label><input type="text" name="location" value={formData.location} onChange={handleModalInputChange} className="form-input" maxLength={100} /><small className="char-counter">{formData.location.length} / 100</small></div><div className="form-group"><label>Data</label><input type="date" name="date" value={formData.date} onChange={handleModalInputChange} className="form-input" max={today} /></div><div className="form-group"><label>Immagine</label><input type="file" name="image" onChange={handleFileChange} className="form-input" accept="image/png, image/jpeg, image/gif"/>{selectedFile && <p className="file-name-preview">File selezionato: {selectedFile.name}</p>}</div></div><div className="modal-footer"><button onClick={() => setModal(null)} className="web3-button secondary">Chiudi</button><button onClick={handleInitializeBatch} disabled={isPending || isUploading} className="web3-button">{isUploading ? "Caricamento..." : "Conferma"}</button></div></div></div> )}
            
            {/* MODIFICA: Renderizza il popup di stato della transazione */}
            {(isPending || txResult) && (
                <TransactionStatusModal
                    status={isPending ? 'loading' : txResult!.status}
                    message={isPending ? 'Transazione in corso, attendi...' : txResult!.message}
                    onClose={() => {
                        // Se la transazione ha avuto successo, chiudi anche il form
                        if (txResult?.status === 'success') {
                            setModal(null);
                            setFormData({ name: "", description: "", date: new Date().toISOString().split('T')[0], location: "" });
                            setSelectedFile(null);
                        }
                        // In ogni caso, nascondi il popup di notifica
                        setTxResult(null);
                    }}
                />
            )}
        </div>
    );
}
