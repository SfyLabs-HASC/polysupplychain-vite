// FILE: src/pages/AziendaPage.tsx
// VERSIONE CON CORREZIONI GRAFICHE AL POPUP E AL FLUSSO DI CARICAMENTO

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
    const [currentStep, setCurrentStep] = useState(1);

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
        // --- [MODIFICA] Chiudiamo il modal del wizard per mostrare quello di loading ---
        setModal(null);

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
                const response = await fetch('/api/upload', { method: 'POST', body: body });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.details || 'Errore dal server di upload.');
                }
                const { cid } = await response.json();
                if (!cid) { throw new Error("CID non ricevuto dalla nostra API."); }
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
            contract, abi, 
            method: "function initializeBatch(string,string,string,string,string)", 
            params: [formData.name, formData.description, formData.date, formData.location, imageIpfsHash] 
        });
        sendTransaction(transaction, { 
            onSuccess: async () => { 
                setTxResult({ status: 'success', message: 'Iscrizione creata con successo!' });
                setLoadingMessage('');
                await fetchAllBatches(); 
                await refetchContributorInfo();
            },
            onError: (err) => { 
                setTxResult({ status: 'error', message: err.message.toLowerCase().includes("insufficient funds") ? "Crediti Insufficienti, Ricarica" : "Errore nella transazione." }); 
                setLoadingMessage('');
            } 
        });
    };
    
    const handleCloseModal = () => {
        setModal(null);
        setCurrentStep(1);
        setFormData({ name: "", description: "", date: new Date().toISOString().split('T')[0], location: "" });
        setSelectedFile(null);
    };

    const handleNextStep = () => {
        if (currentStep === 1 && !formData.name.trim()) {
            alert("Il campo 'Nome Iscrizione' è obbligatorio per procedere.");
            return;
        }
        setCurrentStep(prev => prev + 1);
    };

    const handlePrevStep = () => {
        setCurrentStep(prev => prev - 1);
    };
    
    if (!account) { return <div className='login-container'><ConnectButton client={client} chain={polygon} accountAbstraction={{ chain: polygon, sponsorGas: true }} wallets={[inAppWallet()]} connectButton={{ label: "Connettiti / Log In", style: { fontSize: '1.2rem', padding: '1rem 2rem' } }} /></div>; }
    
    const renderDashboardContent = () => { 
        if (isStatusLoading) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica stato account...</p>; 
        const isActive = contributorData?.[2] ?? false; 
        if (!isActive) return <RegistrationForm />; 
        return (
            <> 
                <DashboardHeader contributorInfo={contributorData!} onNewInscriptionClick={() => { setModal('init'); setCurrentStep(1); }} /> 
                {isLoadingBatches ? <p style={{textAlign: 'center', marginTop: '2rem'}}>Caricamento iscrizioni...</p> : 
                    <BatchTable batches={filteredBatches} nameFilter={nameFilter} setNameFilter={setNameFilter} locationFilter={locationFilter} setLocationFilter={setLocationFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter}/>
                } 
            </>
        ); 
    };
    
    const isProcessing = loadingMessage !== '' || isPending;
    
    // --- [MODIFICA] Stile del box di aiuto con sfondo scuro ---
    const helpTextStyle = {
        backgroundColor: '#343a40', // Grigio scuro
        border: '1px solid #495057',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '16px',
        fontSize: '0.9rem',
        color: '#f8f9fa' // Testo chiaro
    };

    return (
        <div className="app-container-full" style={{ padding: '0 2rem' }}>
            <header className="main-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>EasyChain - Area Riservata</div>
                <div className="wallet-button-container"><ConnectButton client={client} chain={polygon} detailsModal={{ hideSend: true, hideReceive: true, hideBuy: true, hideTransactionHistory: true }}/></div>
            </header>
            <main className="main-content-full">
                {renderDashboardContent()}
            </main>
            
            {modal === 'init' && ( 
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2>Nuova Iscrizione ({currentStep}/5)</h2></div>
                        <div className="modal-body" style={{ minHeight: '350px' }}>
                            
                            {currentStep === 1 && (
                                <div>
                                    <div className="form-group">
                                        <label>Nome Iscrizione <span style={{color: 'red', fontWeight:'bold'}}>* Obbligatorio</span></label>
                                        <input type="text" name="name" value={formData.name} onChange={handleModalInputChange} className="form-input" maxLength={100} />
                                        <small className="char-counter">{formData.name.length} / 100</small>
                                    </div>
                                    <div style={helpTextStyle}>
                                        <p><strong>ℹ️ Come scegliere il Nome Iscrizione</strong></p>
                                        <p>Il Nome Iscrizione è un'etichetta descrittiva che ti aiuta a identificare in modo chiaro ciò che stai registrando on-chain. Ad esempio:</p>
                                        <ul style={{textAlign: 'left', paddingLeft: '20px'}}>
                                            <li>Il nome di un prodotto o varietà: <em>Pomodori San Marzano 2025</em></li>
                                            <li>Il numero di lotto: <em>Lotto LT1025 – Olio EVO 3L</em></li>
                                            <li>Il nome di un contratto: <em>Contratto fornitura COOP – Aprile 2025</em></li>
                                            <li>Una certificazione o audit: <em>Certificazione Bio ICEA 2025</em></li>
                                            <li>Un riferimento amministrativo: <em>Ordine n.778 – Cliente NordItalia</em></li>
                                        </ul>
                                        <p style={{marginTop: '1rem'}}><strong>📌 Consiglio:</strong> scegli un nome breve ma significativo, che ti aiuti a ritrovare facilmente l’iscrizione anche dopo mesi o anni.</p>
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div>
                                    <div className="form-group">
                                        <label>Descrizione <span style={{color: '#6c757d'}}>Non obbligatorio</span></label>
                                        <textarea name="description" value={formData.description} onChange={handleModalInputChange} className="form-input" rows={4} maxLength={500}></textarea>
                                        <small className="char-counter">{formData.description.length} / 500</small>
                                    </div>
                                     <div style={helpTextStyle}>
                                        <p>Inserisci una descrizione del prodotto, lotto, contratto o altro elemento principale. Fornisci tutte le informazioni essenziali per identificarlo chiaramente nella filiera o nel contesto dell’iscrizione.</p>
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div>
                                    <div className="form-group">
                                        <label>Luogo <span style={{color: '#6c757d'}}>Non obbligatorio</span></label>
                                        <input type="text" name="location" value={formData.location} onChange={handleModalInputChange} className="form-input" maxLength={100} />
                                        <small className="char-counter">{formData.location.length} / 100</small>
                                    </div>
                                    <div style={helpTextStyle}>
                                        <p>Inserisci il luogo di origine o di produzione del prodotto o lotto. Può essere una città, una regione, un'azienda agricola o uno stabilimento specifico per identificare con precisione dove è stato realizzato.</p>
                                    </div>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div>
                                    <div className="form-group">
                                        <label>Data <span style={{color: '#6c757d'}}>Non obbligatorio</span></label>
                                        <input type="date" name="date" value={formData.date} onChange={handleModalInputChange} className="form-input" max={today} />
                                    </div>
                                     <div style={helpTextStyle}>
                                        <p>Inserisci una data, puoi utilizzare il giorno attuale o una data precedente alla conferma di questa Iscrizione.</p>
                                    </div>
                                </div>
                            )}

                            {currentStep === 5 && (
                                <div>
                                    <div className="form-group">
                                        <label>Immagine <span style={{color: '#6c757d'}}>Non obbligatorio</span></label>
                                        <input type="file" name="image" onChange={handleFileChange} className="form-input" accept="image/png, image/jpeg, image/webp"/>
                                        {selectedFile && <p className="file-name-preview">File selezionato: {selectedFile.name}</p>}
                                        <small style={{marginTop: '4px'}}>Formati: PNG, JPG, JPEG, WEBP. Max: 5 MB.</small>
                                    </div>
                                     <div style={helpTextStyle}>
                                        <p>Carica un’immagine rappresentativa del prodotto, lotto, contratto, etc. Rispetta i formati e i limiti di peso.</p>
                                    </div>
                                </div>
                            )}

                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                            <div>
                                {currentStep > 1 && <button onClick={handlePrevStep} className="web3-button secondary">Indietro</button>}
                            </div>
                            <div>
                                <button onClick={handleCloseModal} className="web3-button secondary">Chiudi</button>
                                {currentStep < 5 && <button onClick={handleNextStep} className="web3-button">Avanti</button>}
                                {currentStep === 5 && <button onClick={handleInitializeBatch} disabled={isProcessing} className="web3-button">{isProcessing ? "..." : "Conferma"}</button>}
                            </div>
                        </div>
                    </div>
                </div> 
            )}
            
            {/* --- [MODIFICA] Logica di visualizzazione dei popup di stato --- */}
            {isProcessing && (
                <TransactionStatusModal status={'loading'} message={loadingMessage} onClose={() => {}} />
            )}
            {txResult && (
                 <TransactionStatusModal status={txResult.status} message={txResult.message} onClose={() => { 
                    if (txResult?.status === 'success') { handleCloseModal(); } 
                    setTxResult(null); 
                }} />
            )}
        </div>
    );
}