import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall, readContract } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { inAppWallet } from 'thirdweb/wallets';
import { supplyChainABI as abi } from '../abi/contractABI';
import '../App.css'; 
import './AziendaPage.css'; // Stili per la responsività

import TransactionStatusModal from '../components/TransactionStatusModal';

const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ 
  client, 
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});

const RegistrationForm = () => (
    <div className="card">
        <h3>Benvenuto su Easy Chain!</h3>
        <p>Il tuo account non è ancora attivo. Compila il form di registrazione per inviare una richiesta di attivazione.</p>
    </div>
);

const BatchRow = ({ batch, localId }: { batch: BatchData; localId: number }) => {
    const [showDescription, setShowDescription] = useState(false);
    const { data: stepCount } = useReadContract({ contract, abi, method: "function getBatchStepCount(uint256 _batchId) view returns (uint256)", params: [batch.batchId] });
    
    const formatDate = (dateStr: string | undefined) => !dateStr || dateStr.split('-').length !== 3 ? '/' : dateStr.split('-').reverse().join('/');

    return (
        <>
            <tr className="desktop-row">
                <td>{localId}</td>
                <td><span className="clickable-name" onClick={() => setShowDescription(true)}>{batch.name || '/'}</span></td>
                <td>{formatDate(batch.date)}</td>
                <td>{batch.location || '/'}</td>
                <td>{stepCount !== undefined ? stepCount.toString() : '/'}</td>
                <td>{batch.isClosed ? <span className="status-closed">✅ Chiuso</span> : <span className="status-open">⏳ Aperto</span>}</td>
                <td><Link to={`/gestisci/${batch.batchId}`} className="web3-button">Gestisci</Link></td>
            </tr>
            <div className="mobile-card">
                <div className="card-header">
                    <strong className="clickable-name" onClick={() => setShowDescription(true)}>{batch.name || 'N/A'}</strong>
                    <span className={`status ${batch.isClosed ? 'status-closed' : 'status-open'}`}>
                        {batch.isClosed ? '✅ Chiuso' : '⏳ Aperto'}
                    </span>
                </div>
                <div className="card-body">
                    <p><strong>ID:</strong> {localId}</p>
                    <p><strong>Data:</strong> {formatDate(batch.date)}</p>
                    <p><strong>Luogo:</strong> {batch.location || '/'}</p>
                    <p><strong>N° Passaggi:</strong> {stepCount !== undefined ? stepCount.toString() : '/'}</p>
                </div>
                <div className="card-footer">
                    <Link to={`/gestisci/${batch.batchId}`} className="web3-button">Gestisci</Link>
                </div>
            </div>
            {showDescription && (
                <div className="modal-overlay" onClick={() => setShowDescription(false)}>
                    <div className="modal-content description-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2>Descrizione Iscrizione / Lotto</h2></div>
                        <div className="modal-body"><p>{batch.description || 'Nessuna descrizione fornita.'}</p></div>
                        <div className="modal-footer"><button onClick={() => setShowDescription(false)} className="web3-button">Chiudi</button></div>
                    </div>
                </div>
            )}
        </>
    );
};

interface BatchData { id: string; batchId: bigint; name: string; description: string; date: string; location: string; isClosed: boolean; }

const BatchTable = ({ batches, nameFilter, setNameFilter, locationFilter, setLocationFilter, statusFilter, setStatusFilter }: any) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsToShow, setItemsToShow] = useState(10);
    const MAX_PER_PAGE = 30;
    const totalPages = Math.max(1, Math.ceil(batches.length / MAX_PER_PAGE));
    const startIndex = (currentPage - 1) * MAX_PER_PAGE;
    const itemsOnCurrentPage = batches.slice(startIndex, startIndex + MAX_PER_PAGE);
    const visibleBatches = itemsOnCurrentPage.slice(0, itemsToShow);

    useEffect(() => {
        setCurrentPage(1);
        setItemsToShow(10);
    }, [batches]);

    const handleLoadMore = () => setItemsToShow(prev => Math.min(prev + 10, MAX_PER_PAGE));
    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        setItemsToShow(10);
    };
    
    return (
        <div className="table-container">
            <table className="company-table">
                <thead>
                    <tr className="desktop-row">
                        <th>ID</th><th>Nome</th><th>Data</th><th>Luogo</th><th>N° Passaggi</th><th>Stato</th><th>Azione</th>
                    </tr>
                    <tr className="filter-row">
                        <th></th>
                        <th><input type="text" placeholder="Filtra..." className="filter-input" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} /></th>
                        <th></th>
                        <th><input type="text" placeholder="Filtra..." className="filter-input" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} /></th>
                        <th></th>
                        <th><select className="filter-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">Tutti</option><option value="open">Aperto</option><option value="closed">Chiuso</option></select></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {visibleBatches.length > 0 ? 
                        visibleBatches.map((batch, index) => <BatchRow key={batch.id} batch={batch} localId={startIndex + index + 1} />) : 
                        (<tr><td colSpan={7} style={{textAlign: 'center'}}>Nessuna iscrizione trovata.</td></tr>)
                    }
                </tbody>
            </table>
            <div className="pagination-controls">
                {itemsToShow < itemsOnCurrentPage.length && (<button onClick={handleLoadMore} className='link-button'>Vedi altri 10...</button>)}
                <div className="page-selector">
                    {totalPages > 1 && <> <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>&lt;</button> <span> Pagina {currentPage} di {totalPages} </span> <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>&gt;</button></>}
                </div>
            </div>
        </div>
    );
};

const DashboardHeader = ({ contributorInfo, onNewInscriptionClick }: { contributorInfo: readonly [string, bigint, boolean], onNewInscriptionClick: () => void }) => {
    const companyName = contributorInfo[0] || 'Azienda';
    const credits = contributorInfo[1].toString();
    
    return (
        <div className="dashboard-header-card">
            <div className="dashboard-header-info">
                <h2 className="company-name-header">{companyName}</h2>
                <div className="company-status-container">
                    <div className="status-item"><span>Crediti: <strong>{credits}</strong></span></div>
                    <div className="status-item"><span>Stato: <strong>ATTIVO</strong></span><span className="status-icon">✅</span></div>
                </div>
            </div>
            <div className="header-actions">
                <button className="web3-button large" onClick={onNewInscriptionClick}>Nuova Iscrizione</button>
            </div>
        </div>
    );
};

// Initial state for the form
const getInitialFormData = () => ({
    name: "",
    description: "",
    date: "", 
    location: ""
});

export default function AziendaPage() {
    const account = useActiveAccount();
    const { data: contributorData, isLoading: isStatusLoading, refetch: refetchContributorInfo, isError } = useReadContract({
        contract,
        method: "function getContributorInfo(address) view returns (string, uint256, bool)",
        params: account ? [account.address] : undefined,
        queryOptions: { enabled: !!account }
    });

    const prevAccountRef = useRef(account?.address);
    useEffect(() => {
        if (prevAccountRef.current && !account) {
            window.location.href = '/';
        }
        if (account?.address && prevAccountRef.current !== account.address) {
            refetchContributorInfo();
            fetchAllBatches();
        }
        prevAccountRef.current = account?.address;
    }, [account]);

    const { mutate: sendTransaction, isPending } = useSendTransaction();
    
    const [modal, setModal] = useState<'init' | null>(null);
    const [formData, setFormData] = useState(getInitialFormData());
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [txResult, setTxResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
    const [allBatches, setAllBatches] = useState<BatchData[]>([]);
    const [filteredBatches, setFilteredBatches] = useState<BatchData[]>([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(true);
    
    const [nameFilter, setNameFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    const [loadingMessage, setLoadingMessage] = useState('');
    const [currentStep, setCurrentStep] = useState(1);

    const fetchAllBatches = async () => {
        if (!account?.address) return;
        setIsLoadingBatches(true);
        try {
            const batchIds = await readContract({ contract, abi, method: "function getBatchesByContributor(address) view returns (uint256[])", params: [account.address] }) as bigint[];
            const batchDataPromises = batchIds.map(id => 
                readContract({ contract, abi, method: "function getBatchInfo(uint256) view returns (uint256,address,string,string,string,string,string,string,bool)", params: [id] })
                .then(info => ({ id: id.toString(), batchId: id, name: info[3], description: info[4], date: info[5], location: info[6], isClosed: info[8] }))
            );
            const results = await Promise.all(batchDataPromises);
            setAllBatches(results);
        } catch (error) {
            console.error("Errore nel caricare i lotti:", error);
            setAllBatches([]);
        } finally {
            setIsLoadingBatches(false);
        }
    };

    useEffect(() => {
        if (account?.address) {
            fetchAllBatches();
        }
    }, [account?.address]);

    useEffect(() => {
        let tempBatches = [...allBatches];
        if (nameFilter) tempBatches = tempBatches.filter(b => b.name.toLowerCase().includes(nameFilter.toLowerCase()));
        if (locationFilter) tempBatches = tempBatches.filter(b => b.location.toLowerCase().includes(locationFilter.toLowerCase()));
        if (statusFilter !== 'all') {
            const isOpen = statusFilter === 'open';
            tempBatches = tempBatches.filter(b => !b.isClosed === isOpen);
        }
        tempBatches.sort((a, b) => Number(b.batchId) - Number(a.batchId));
        setFilteredBatches(tempBatches);
    }, [nameFilter, locationFilter, statusFilter, allBatches]);
    
    const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedFile(e.target.files?.[0] || null);
    };
    
    const handleInitializeBatch = async () => {
        setCurrentStep(prev => prev + 1); // visually confirms click, then process
    
        if (!formData.name.trim()) {
            setTxResult({ status: 'error', message: 'Il campo Nome è obbligatorio.' });
            setCurrentStep(6); // Go back to confirmation step
            return;
        }
    
        let imageIpfsHash = "N/A";
        if (selectedFile) {
            const MAX_SIZE_MB = 5;
            const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
            const ALLOWED_FORMATS = ['image/png', 'image/jpeg', 'image/webp'];
            if (selectedFile.size > MAX_SIZE_BYTES) {
                setTxResult({ status: 'error', message: `Il file è troppo grande. Limite: ${MAX_SIZE_MB} MB.` });
                setCurrentStep(6);
                return;
            }
            if (!ALLOWED_FORMATS.includes(selectedFile.type)) {
                setTxResult({ status: 'error', message: 'Formato immagine non supportato.' });
                setCurrentStep(6);
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
                if (!cid) throw new Error("CID non ricevuto dall'API.");
                imageIpfsHash = cid;
            } catch (error: any) {
                setTxResult({ status: 'error', message: `Errore caricamento: ${error.message}` });
                setLoadingMessage('');
                setCurrentStep(6);
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
                setCurrentStep(6);
            } 
        });
    };
    
    const handleCloseModal = () => {
        setModal(null);
        setCurrentStep(1);
        setFormData(getInitialFormData());
        setSelectedFile(null);
    };

    const handleNextStep = () => {
        if (currentStep === 1 && !formData.name.trim()) {
            alert("Il campo 'Nome Iscrizione' è obbligatorio per procedere.");
            return;
        }
        setCurrentStep(prev => prev + 1);
    };

    const handlePrevStep = () => setCurrentStep(prev => prev - 1);
    
    if (!account) {
        return (
            <div className='login-container'>
                <ConnectButton 
                    client={client} 
                    chain={polygon} 
                    accountAbstraction={{ chain: polygon, sponsorGas: true }} 
                    wallets={[inAppWallet()]} 
                    connectButton={{ label: "Connettiti / Log In", style: { fontSize: '1.2rem', padding: '1rem 2rem' } }} 
                />
            </div>
        );
    }
    
    const renderDashboardContent = () => { 
        if (isStatusLoading) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica stato account...</p>; 
        if (isError) return <p style={{textAlign: 'center', marginTop: '4rem', color: 'red'}}>Errore nel recuperare i dati dell'account. Riprova.</p>
        
        const isActive = contributorData?.[2] ?? false; 
        if (!isActive) return <RegistrationForm />; 
        
        return (
            <> 
                <DashboardHeader contributorInfo={contributorData!} onNewInscriptionClick={() => { setModal('init'); setCurrentStep(1); setFormData(getInitialFormData()); setSelectedFile(null); }} /> 
                {isLoadingBatches ? 
                    <p style={{textAlign: 'center', marginTop: '2rem'}}>Caricamento iscrizioni...</p> : 
                    <BatchTable 
                        batches={filteredBatches} 
                        nameFilter={nameFilter} setNameFilter={setNameFilter} 
                        locationFilter={locationFilter} setLocationFilter={setLocationFilter} 
                        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                    />
                } 
            </>
        ); 
    };
    
    const isProcessing = loadingMessage !== '' || isPending;
    
    const helpTextStyle = {
        backgroundColor: '#343a40', border: '1px solid #495057', borderRadius: '8px',
        padding: '16px', marginTop: '16px', fontSize: '0.9rem', color: '#f8f9fa'
    };

    const recapStyle = {
        textAlign: 'left' as const, padding: '10px', border: '1px solid #495057', 
        borderRadius: '8px', backgroundColor: '#2c3034', marginBottom: '20px'
    };

    return (
        <div className="app-container-full">
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
            <main className="main-content-full">
                {renderDashboardContent()}
            </main>
            
            {modal === 'init' && ( 
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2>Nuova Iscrizione ({currentStep}/6)</h2></div>
                        <div className="modal-body" style={{ minHeight: '350px' }}>
                            {/* Steps 1 to 5 */}
                            {currentStep === 1 && (
                                <div>
                                    <div className="form-group">
                                        <label>Nome Iscrizione <span style={{color: 'red', fontWeight:'bold'}}>* Obbligatorio</span></label>
                                        <input type="text" name="name" value={formData.name} onChange={handleModalInputChange} className="form-input" maxLength={100} />
                                        <small className="char-counter">{formData.name.length} / 100</small>
                                    </div>
                                    <div style={helpTextStyle}>
                                        <p><strong>ℹ️ Come scegliere il Nome Iscrizione</strong></p>
                                        <p>Il Nome Iscrizione è un'etichetta che ti aiuta a identificare ciò che stai registrando. Ad esempio:</p>
                                        <ul style={{textAlign: 'left', paddingLeft: '20px'}}>
                                            <li>Prodotto: <em>Pomodori San Marzano 2025</em></li>
                                            <li>Lotto: <em>Lotto LT1025 – Olio EVO 3L</em></li>
                                            <li>Contratto: <em>Contratto fornitura COOP – Aprile 2025</em></li>
                                        </ul>
                                        <p style={{marginTop: '1rem'}}><strong>📌 Consiglio:</strong> scegli un nome breve ma significativo.</p>
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
                                    <div style={helpTextStyle}><p>Fornisci i dettagli essenziali per identificare l'elemento nella filiera.</p></div>
                                </div>
                            )}
                            {currentStep === 3 && (
                                <div>
                                    <div className="form-group">
                                        <label>Luogo <span style={{color: '#6c757d'}}>Non obbligatorio</span></label>
                                        <input type="text" name="location" value={formData.location} onChange={handleModalInputChange} className="form-input" maxLength={100} />
                                        <small className="char-counter">{formData.location.length} / 100</small>
                                    </div>
                                    <div style={helpTextStyle}><p>Inserisci il luogo di origine o produzione (città, regione, stabilimento).</p></div>
                                </div>
                            )}
                            {currentStep === 4 && (
                                <div>
                                    <div className="form-group">
                                        <label>Data <span style={{color: '#6c757d'}}>Non obbligatorio</span></label>
                                        <input type="date" name="date" value={formData.date} onChange={handleModalInputChange} className="form-input" max={new Date().toISOString().split('T')[0]} />
                                    </div>
                                    <div style={helpTextStyle}><p>Inserisci una data. Se vuoto, non verrà registrata.</p></div>
                                </div>
                            )}
                            {currentStep === 5 && (
                                <div>
                                    <div className="form-group">
                                        <label>Immagine <span style={{color: '#6c757d'}}>Non obbligatorio</span></label>
                                        <input type="file" name="image" onChange={handleFileChange} className="form-input" accept="image/png, image/jpeg, image/webp"/>
                                        {selectedFile && <p className="file-name-preview">File: {selectedFile.name}</p>}
                                        <small style={{marginTop: '4px'}}>Formati: PNG, JPG, WEBP. Max: 5 MB.</small>
                                    </div>
                                    <div style={helpTextStyle}>
                                        <p>Carica un’immagine rappresentativa. Per una visualizzazione ottimale, usa un'immagine quadrata (1:1).</p>
                                    </div>
                                </div>
                            )}
                             {currentStep === 6 && (
                                <div>
                                    <h4>Riepilogo Dati</h4>
                                    <div style={recapStyle}>
                                        <p><strong>Nome:</strong> {formData.name || 'Non specificato'}</p>
                                        <p><strong>Descrizione:</strong> {formData.description || 'Non specificata'}</p>
                                        <p><strong>Luogo:</strong> {formData.location || 'Non specificato'}</p>
                                        <p><strong>Data:</strong> {formData.date ? formData.date.split('-').reverse().join('/') : 'Non specificata'}</p>
                                        <p><strong>Immagine:</strong> {selectedFile?.name || 'Nessuna'}</p>
                                    </div>
                                    <p>Vuoi confermare tutti i dati che hai immesso?</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                            <div>
                                {currentStep > 1 && <button onClick={handlePrevStep} className="web3-button secondary">Indietro</button>}
                            </div>
                            <div>
                                <button onClick={handleCloseModal} className="web3-button secondary">Chiudi</button>
                                {currentStep < 6 && <button onClick={handleNextStep} className="web3-button">Avanti</button>}
                                {currentStep === 6 && <button onClick={handleInitializeBatch} disabled={isProcessing} className="web3-button">{isProcessing ? "..." : "Conferma"}</button>}
                            </div>
                        </div>
                    </div>
                </div> 
            )}
            
            {isProcessing && (
                <TransactionStatusModal status={'loading'} message={loadingMessage} onClose={() => {}} />
            )}

            {txResult && (
                <TransactionStatusModal status={txResult.status} message={txResult.message} onClose={() => { 
                    if (txResult?.status === 'success') handleCloseModal();
                    setTxResult(null); 
                }} />
            )}
        </div>
    );
}