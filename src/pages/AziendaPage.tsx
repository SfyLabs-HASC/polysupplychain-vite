// FILE: src/pages/AziendaPage.tsx
// VERSIONE CON GATEWAY DEDICATO FILEBASE PER IL TEST

import React, { useState, useEffect, useRef } from 'react';
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall, readContract } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { inAppWallet } from 'thirdweb/wallets';
import { supplyChainABI as abi } from '../abi/contractABI';
import '../App.css'; 

import TransactionStatusModal from '../components/TransactionStatusModal';

const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ 
  client, 
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});

const RegistrationForm = () => ( <div className="card"><h3>Benvenuto su Easy Chain!</h3><p>Il tuo account non è ancora attivo. Compila il form di registrazione per inviare una richiesta di attivazione.</p></div> );

const BatchRow = ({ batch, localId }: { batch: BatchData; localId: number }) => {
    const [showDescription, setShowDescription] = useState(false);
    const { data: stepCount } = useReadContract({ contract, abi, method: "function getBatchStepCount(uint256 _batchId) view returns (uint256)", params: [batch.batchId] });
    const formatDate = (dateStr: string | undefined) => !dateStr || dateStr.split('-').length !== 3 ? '/' : dateStr.split('-').reverse().join('/');
    return (<><tr><td>{localId}</td><td><span className="clickable-name" onClick={() => setShowDescription(true)}>{batch.name || '/'}</span></td><td>{formatDate(batch.date)}</td><td>{batch.location || '/'}</td><td>{stepCount !== undefined ? stepCount.toString() : '/'}</td><td>{batch.isClosed ? <span className="status-closed">✅ Chiuso</span> : <span className="status-open">⏳ Aperto</span>}</td><td><button className="web3-button" onClick={() => alert('Pronto per il Passaggio 2!')}>Gestisci</button></td></tr>{showDescription && (<div className="modal-overlay" onClick={() => setShowDescription(false)}><div className="modal-content description-modal" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h2>Descrizione Iscrizione / Lotto</h2></div><div className="modal-body"><p>{batch.description || 'Nessuna descrizione fornita.'}</p></div><div className="modal-footer"><button onClick={() => setShowDescription(false)} className="web3-button">Chiudi</button></div></div></div>)}</>);
};

interface BatchData { id: string; batchId: bigint; name: string; description: string; date: string; location: string; isClosed: boolean; }
const BatchTable = ({ batches, nameFilter, setNameFilter, locationFilter, setLocationFilter, statusFilter, setStatusFilter }: any) => {
    const [currentPage, setCurrentPage] = useState(1); const [itemsToShow, setItemsToShow] = useState(10); const MAX_PER_PAGE = 30; const totalPages = Math.max(1, Math.ceil(batches.length / MAX_PER_PAGE)); const startIndex = (currentPage - 1) * MAX_PER_PAGE; const itemsOnCurrentPage = batches.slice(startIndex, startIndex + MAX_PER_PAGE); const visibleBatches = itemsOnCurrentPage.slice(0, itemsToShow); useEffect(() => { setCurrentPage(1); setItemsToShow(10); }, [batches]); const handleLoadMore = () => setItemsToShow(prev => Math.min(prev + 10, MAX_PER_PAGE)); const handlePageChange = (page: number) => { if (page < 1 || page > totalPages) return; setCurrentPage(page); setItemsToShow(10); };
    return (<div className="table-container"><table className="company-table"><thead><tr><th>ID</th><th>Nome</th><th>Data</th><th>Luogo</th><th>N° Passaggi</th><th>Stato</th><th>Azione</th></tr><tr className="filter-row"><th></th><th><input type="text" placeholder="Filtra..." className="filter-input" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} /></th><th></th><th><input type="text" placeholder="Filtra..." className="filter-input" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} /></th><th></th><th><select className="filter-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">Tutti</option><option value="open">Aperto</option><option value="closed">Chiuso</option></select></th><th></th></tr></thead><tbody>{visibleBatches.length > 0 ? (visibleBatches.map((batch, index) => <BatchRow key={batch.id} batch={batch} localId={startIndex + index + 1} />)) : (<tr><td colSpan={7} style={{textAlign: 'center'}}>Nessuna iscrizione trovata.</td></tr>)}</tbody></table><div className="pagination-controls">{itemsToShow < itemsOnCurrentPage.length && (<button onClick={handleLoadMore} className='link-button'>Vedi altri 10...</button>)}<div className="page-selector">{totalPages > 1 && <> <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>&lt;</button> <span> Pagina {currentPage} di {totalPages} </span> <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>&gt;</button></>}</div></div></div>);
};

const DashboardHeader = ({ contributorInfo, onNewInscriptionClick }: { contributorInfo: readonly [string, bigint, boolean], onNewInscriptionClick: () => void }) => {
    const companyName = contributorInfo[0] || 'Azienda';
    const credits = contributorInfo[1].toString();
    return (
        <div className="dashboard-header-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            <div>
                <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '3rem' }}>Ciao, {companyName}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div className="status-item"><span>Crediti Rimanenti: <strong>{credits}</strong></span></div>
                    <div className="status-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>Stato: <strong>ATTIVO</strong></span><span className="status-icon">✅</span></div>
                </div>
            </div>
            <div className="header-actions"><button className="web3-button large" onClick={onNewInscriptionClick}>Nuova Iscrizione</button></div>
        </div>
    );
};

export default function AziendaPage() {
    const account = useActiveAccount();
    const { data: contributorData, isLoading: isStatusLoading, refetch: refetchContributorInfo } = useReadContract({ contract, method: "function getContributorInfo(address) view returns (string, uint256, bool)", params: account ? [account.address] : undefined, queryOptions: { enabled: !!account } });
    
    const prevAccount = useRef(account);
    useEffect(() => {
        if (prevAccount.current && !account) {
            window.location.href = '/';
        }
        prevAccount.current = account;
    }, [account]);

    const { mutate: sendTransaction, isPending } = useSendTransaction();
    const [modal, setModal] = useState<'init' | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "", date: new Date().toISOString().split('T')[0], location: "" });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [txResult, setTxResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
    const [allBatches, setAllBatches] = useState<BatchData[]>([]);
    const [filteredBatches, setFilteredBatches] = useState<BatchData[]>([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(true);
    
    const [nameFilter, setNameFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const today = new Date().toISOString().split('T')[0];
    
    const [loadingMessage, setLoadingMessage] = useState('');
    const [lastImageCid, setLastImageCid] = useState<string | null>(null);

    const fetchAllBatches = async () => {
        if (!account?.address) return;
        setIsLoadingBatches(true);
        try {
            const batchIds = await readContract({ contract, abi, method: "function getBatchesByContributor(address) view returns (uint256[])", params: [account.address] }) as bigint[];
            const batchDataPromises = batchIds.map(id => readContract({ contract, abi, method: "function getBatchInfo(uint256) view returns (uint256,address,string,string,string,string,string,string,bool)", params: [id] }).then(info => ({ id: id.toString(), batchId: id, name: info[3], description: info[4], date: info[5], location: info[6], isClosed: info[8] })));
            const results = await Promise.all(batchDataPromises);
            setAllBatches(results);
        } catch (error) { console.error("Errore nel caricare i lotti:", error); setAllBatches([]); } 
        finally { setIsLoadingBatches(false); }
    };

    useEffect(() => { fetchAllBatches(); }, [account?.address]);

    useEffect(() => {
        let tempBatches = [...allBatches];
        if (nameFilter) { tempBatches = tempBatches.filter(b => b.name.toLowerCase().includes(nameFilter.toLowerCase())); }
        if (locationFilter) { tempBatches = tempBatches.filter(b => b.location.toLowerCase().includes(locationFilter.toLowerCase())); }
        if (statusFilter !== 'all') { const isOpen = statusFilter === 'open'; tempBatches = tempBatches.filter(b => !b.isClosed === isOpen); }
        tempBatches.sort((a, b) => Number(b.batchId - a.batchId));
        setFilteredBatches(tempBatches);
    }, [nameFilter, locationFilter, statusFilter, allBatches]);
    
    const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const { name, value } = e.target; setFormData(prev => ({...prev, [name]: value})); };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => setSelectedFile(e.target.files?.[0] || null);
    
    const handleInitializeBatch = async () => {
        if (!formData.name.trim()) {
            setTxResult({ status: 'error', message: 'Il campo Nome è obbligatorio.' });
            return;
        }

        let imageIpfsHash = "N/A";

        if (selectedFile) {
            const MAX_SIZE_MB = 5;
            const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
            const ALLOWED_FORMATS = ['image/png', 'image/jpeg', 'image/webp'];
            if (selectedFile.size > MAX_SIZE_BYTES) {
                setTxResult({ status: 'error', message: `Il file è troppo grande. Limite massimo: ${MAX_SIZE_MB} MB.` });
                return;
            }
            if (!ALLOWED_FORMATS.includes(selectedFile.type)) {
                setTxResult({ status: 'error', message: 'Formato immagine non supportato.' });
                return;
            }

            setLoadingMessage('Caricamento Immagine, attendi...');
            
            try {
                const body = new FormData();
                body.append('file', selectedFile);
                body.append('companyName', contributorData?.[0] || 'AziendaGenerica');

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: body,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.details || 'Errore dal server di upload.');
                }

                const { cid } = await response.json();
                if (!cid) {
                    throw new Error("CID non ricevuto dalla nostra API.");
                }
                imageIpfsHash = cid;

            } catch (error: any) {
                console.error("Errore durante la chiamata all'API di upload:", error);
                setTxResult({ status: 'error', message: `Errore caricamento: ${error.message}` });
                setLoadingMessage('');
                return;
            }
        }

        setLoadingMessage('Transazione in corso, attendi...');
        
        const transaction = prepareContractCall({ 
            contract, 
            abi, 
            method: "function initializeBatch(string,string,string,string,string)", 
            params: [formData.name, formData.description, formData.date, formData.location, imageIpfsHash] 
        });

        sendTransaction(transaction, { 
            onSuccess: async () => { 
                setTxResult({ status: 'success', message: 'Iscrizione creata con successo!' });
                setLoadingMessage('');
                
                await fetchAllBatches(); 
                await refetchContributorInfo(); 

                try {
                    const batchIds = await readContract({ contract, abi, method: "function getBatchesByContributor(address) view returns (uint256[])", params: [account!.address] }) as bigint[];
                    if (batchIds.length > 0) {
                        const latestBatchId = batchIds.reduce((max, current) => current > max ? current : max, batchIds[0]);
                        const info = await readContract({ contract, abi, method: "function getBatchInfo(uint256) view returns (uint256,address,string,string,string,string,string,string,bool)", params: [latestBatchId] });
                        
                        const cidFromContract = info[7]; 
                        if (cidFromContract && cidFromContract !== "N/A") {
                            setLastImageCid(cidFromContract);
                        } else {
                            setLastImageCid(null);
                        }
                    }
                } catch (e) {
                    console.error("Errore nel recuperare il CID dell'ultimo lotto:", e);
                    setLastImageCid(null);
                }
            },
            onError: (err) => { 
                setTxResult({ status: 'error', message: err.message.toLowerCase().includes("insufficient funds") ? "Crediti Insufficienti, Ricarica" : "Errore nella transazione." }); 
                setLoadingMessage('');
            } 
        });
    };
    
    if (!account) { return <div className='login-container'><ConnectButton client={client} chain={polygon} accountAbstraction={{ chain: polygon, sponsorGas: true }} wallets={[inAppWallet()]} connectButton={{ label: "Connettiti / Log In", style: { fontSize: '1.2rem', padding: '1rem 2rem' } }} /></div>; }
    
    const renderDashboardContent = () => { 
        if (isStatusLoading) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica stato account...</p>; 
        const isActive = contributorData?.[2] ?? false; 
        if (!isActive) return <RegistrationForm />; 
        return (
            <> 
                <DashboardHeader contributorInfo={contributorData!} onNewInscriptionClick={() => setModal('init')} /> 
                {isLoadingBatches ? <p style={{textAlign: 'center', marginTop: '2rem'}}>Caricamento iscrizioni...</p> : 
                    <BatchTable batches={filteredBatches} nameFilter={nameFilter} setNameFilter={setNameFilter} locationFilter={locationFilter} setLocationFilter={setLocationFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter}/>
                } 
            </>
        ); 
    };
    
    const isProcessing = loadingMessage !== '' || isPending;
    
    return (
        <div className="app-container-full" style={{ padding: '0 2rem' }}>
            <header className="main-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>EasyChain - Area Riservata</div>
                <div className="wallet-button-container"><ConnectButton client={client} chain={polygon} detailsModal={{ hideSend: true, hideReceive: true, hideBuy: true, hideTransactionHistory: true }}/></div>
            </header>
            <main className="main-content-full">
                {renderDashboardContent()}
            </main>

            {lastImageCid && (
                <div style={{
                    border: '2px dashed #ccc',
                    padding: '20px',
                    marginTop: '40px',
                    textAlign: 'center'
                }}>
                    <h3>Immagine dell'Ultima Iscrizione (Test di Debug)</h3>
                    {/* --- [MODIFICA] Utilizziamo il tuo gateway dedicato --- */}
                    <img
                        src={`https://musical-emerald-partridge.myfilebase.com/ipfs/${lastImageCid}`}
                        alt="Immagine dell'ultima iscrizione caricata da IPFS"
                        style={{ maxWidth: '100%', maxHeight: '400px', marginTop: '10px', border: '1px solid #ddd' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; alert('Errore nel caricare l\'immagine dal gateway IPFS.'); }}
                    />
                    <p style={{ marginTop: '15px', wordBreak: 'break-all' }}>
                        <strong>CID recuperato dalla blockchain:</strong> {lastImageCid}
                    </p>
                </div>
            )}


            {modal === 'init' && ( <div className="modal-overlay" onClick={() => setModal(null)}><div className="modal-content" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h2>Nuova Iscrizione</h2></div><div className="modal-body"><div className="form-group"><label>Nome Iscrizione *</label><input type="text" name="name" value={formData.name} onChange={handleModalInputChange} className="form-input" maxLength={50} /><small className="char-counter">{formData.name.length} / 50</small></div><div className="form-group"><label>Descrizione</label><textarea name="description" value={formData.description} onChange={handleModalInputChange} className="form-input" rows={4} maxLength={500}></textarea><small className="char-counter">{formData.description.length} / 500</small></div><div className="form-group"><label>Luogo</label><input type="text" name="location" value={formData.location} onChange={handleModalInputChange} className="form-input" maxLength={100} /><small className="char-counter">{formData.location.length} / 100</small></div><div className="form-group"><label>Data</label><input type="date" name="date" value={formData.date} onChange={handleModalInputChange} className="form-input" max={today} /></div>
            <div className="form-group"><label>Immagine</label><input type="file" name="image" onChange={handleFileChange} className="form-input" accept="image/png, image/jpeg, image/webp"/>{selectedFile && <p className="file-name-preview">File selezionato: {selectedFile.name}</p>}<small style={{marginTop: '4px'}}>Formati: PNG, JPG, JPEG, WEBP. Max: 5 MB.</small></div></div><div className="modal-footer"><button onClick={() => setModal(null)} className="web3-button secondary">Chiudi</button><button onClick={handleInitializeBatch} disabled={isProcessing} className="web3-button">{isProcessing ? (loadingMessage || "...") : "Conferma"}</button></div></div></div> )}
            
            {(isProcessing || txResult) && ( 
                <TransactionStatusModal 
                    status={isProcessing ? 'loading' : txResult!.status} 
                    message={isProcessing ? loadingMessage : txResult!.message} 
                    onClose={() => { 
                        if (txResult?.status === 'success') { 
                            setModal(null); 
                            setFormData({ name: "", description: "", date: new Date().toISOString().split('T')[0], location: "" }); 
                            setSelectedFile(null); 
                        } 
                        setTxResult(null); 
                    }} 
                /> 
            )}
        </div>
    );
}