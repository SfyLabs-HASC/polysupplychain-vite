// FILE: src/pages/AziendaPage.tsx
// VERSIONE MODIFICATA CON NOME CLICCABILE E FILTRO DATA

import React, { useState, useEffect, useMemo } from 'react';
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction, useDisconnect } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall, parseEventLogs, readContract } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { inAppWallet } from 'thirdweb/wallets';
import { supplyChainABI as abi } from '../abi/contractABI';
import '../App.css'; 

// --- Configurazione Centralizzata Thirdweb ---
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ 
  client, 
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});

// ==================================================================
// DEFINIZIONE DEI COMPONENTI HELPER
// ==================================================================

const RegistrationForm = () => {
    return (
        <div className="card">
            <h3>Benvenuto su Easy Chain!</h3>
            <p>Il tuo account non è ancora attivo. Compila il form di registrazione per inviare una richiesta di attivazione.</p>
        </div>
    );
};

// MODIFICA: La riga della tabella ora ha un nome cliccabile e non ha più la colonna "Descrizione" separata.
const BatchRow = ({ batchId, localId }: { batchId: bigint; localId: number }) => {
    const [showDescription, setShowDescription] = useState(false);
    const { data: batchInfo } = useReadContract({ contract, abi, method: "function getBatchInfo(uint256 _batchId) view returns (uint256 id, address contributor, string contributorName, string name, string description, string date, string location, string imageIpfsHash, bool isClosed)", params: [batchId] });
    const { data: stepCount } = useReadContract({ contract, abi, method: "function getBatchStepCount(uint256 _batchId) view returns (uint256)", params: [batchId] });
    
    const name = batchInfo?.[3];
    const description = batchInfo?.[4];
    const dateRaw = batchInfo?.[5];
    const location = batchInfo?.[6];
    const isClosed = batchInfo?.[8];

    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr || dateStr.split('-').length !== 3) return '/';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    return (
        <>
            <tr>
                <td>{localId}</td>
                {/* MODIFICA: Il nome è ora cliccabile per aprire il popup */}
                <td>
                    <span className="clickable-name" onClick={() => setShowDescription(true)}>
                        {name || '/'}
                    </span>
                </td>
                <td>{formatDate(dateRaw)}</td>
                <td>{location || '/'}</td>
                <td>{stepCount !== undefined ? stepCount.toString() : '/'}</td>
                <td>
                    {batchInfo ? (
                        isClosed ? <span className="status-closed">✅ Chiuso</span> : <span className="status-open">⏳ Aperto</span>
                    ) : '...'}
                </td>
                <td><button className="web3-button" onClick={() => alert('Pronto per il Passaggio 2!')}>Visualizza</button></td>
            </tr>
            {/* Il popup della descrizione rimane invariato, ma viene attivato dal click sul nome */}
            {showDescription && (
                <div className="modal-overlay" onClick={() => setShowDescription(false)}>
                    <div className="modal-content description-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2>Descrizione Iscrizione / Lotto</h2></div>
                        <div className="modal-body"><p>{description || 'Nessuna descrizione fornita.'}</p></div>
                        <div className="modal-footer"><button onClick={() => setShowDescription(false)} className="web3-button">Chiudi</button></div>
                    </div>
                </div>
            )}
        </>
    );
};

interface BatchMetadata { id: string; batchId: bigint; name: string; }

// MODIFICA: La tabella non ha più la colonna "Descrizione" e il colSpan è stato aggiornato.
const BatchTable = ({ batches }: { batches: (BatchMetadata & { localId: number })[] }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsToShow, setItemsToShow] = useState(10);
    const MAX_PER_PAGE = 30;

    const totalPages = Math.max(1, Math.ceil(batches.length / MAX_PER_PAGE));
    const startIndex = (currentPage - 1) * MAX_PER_PAGE;
    const itemsOnCurrentPage = batches.slice(startIndex, startIndex + MAX_PER_PAGE);
    const visibleBatches = itemsOnCurrentPage.slice(0, itemsToShow);

    useEffect(() => { setCurrentPage(1); setItemsToShow(10); }, [batches]);
    const handleLoadMore = () => setItemsToShow(prev => Math.min(prev + 10, MAX_PER_PAGE));
    const handlePageChange = (page: number) => { if (page < 1 || page > totalPages) return; setCurrentPage(page); setItemsToShow(10); };
    
    return (
        <div className="table-container">
            <table className="company-table">
                {/* MODIFICA: Rimossa la colonna "Descrizione" dall'intestazione */}
                <thead><tr><th>ID</th><th>Nome</th><th>Data</th><th>Luogo</th><th>N° Passaggi</th><th>Stato</th><th>Azione</th></tr></thead>
                <tbody>
                    {visibleBatches.length > 0 ? (
                        visibleBatches.map(batch => <BatchRow key={batch.id} batchId={batch.batchId} localId={batch.localId} />)
                    ) : (
                        // MODIFICA: colSpan aggiornato da 8 a 7
                        <tr><td colSpan={7} style={{textAlign: 'center'}}>Nessuna iscrizione trovata.</td></tr>
                    )}
                </tbody>
            </table>
            <div className="pagination-controls">
                {itemsToShow < itemsOnCurrentPage.length && (<button onClick={handleLoadMore} className='link-button'>Vedi altri 10...</button>)}
                <div className="page-selector">
                    {totalPages > 1 && <>
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>&lt;</button>
                        <span> Pagina {currentPage} di {totalPages} </span>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>&gt;</button>
                    </>}
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
            <div className="welcome-section">
                <h1>Ciao, "{companyName}"</h1>
                <button className="web3-button large" onClick={onNewInscriptionClick}>Nuova Iscrizione</button>
            </div>
            <div className="status-section">
                <div className="status-item">
                    <span>Stato: <strong>ATTIVO</strong></span>
                    <span className="status-icon">✅</span>
                </div>
                <div className="status-item">
                    <span>Crediti Rimanenti: <strong>{credits}</strong></span>
                </div>
            </div>
        </div>
    );
};

// ==================================================================
// COMPONENTE PRINCIPALE EXPORTATO
// ==================================================================
export default function AziendaPage() {
    const account = useActiveAccount();
    const { disconnect } = useDisconnect();
    const { data: contributorData, isLoading: isStatusLoading } = useReadContract({ contract, method: "function getContributorInfo(address) view returns (string, uint256, bool)", params: account ? [account.address] : undefined, queryOptions: { enabled: !!account } });
    
    const { mutate: sendTransaction, isPending } = useSendTransaction();
    const [modal, setModal] = useState<'init' | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "", date: new Date().toISOString().split('T')[0], location: "" });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const [allBatches, setAllBatches] = useState<(BatchMetadata & { localId: number })[]>([]);
    const [filteredBatches, setFilteredBatches] = useState<(BatchMetadata & { localId: number })[]>([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // MODIFICA: Ottiene la data odierna per usarla come limite massimo nell'input della data
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (!account?.address) return;
        const fetchAllBatches = async () => {
            setIsLoadingBatches(true);
            try {
                const batchIds = await readContract({ contract, abi, method: "function getBatchesByContributor(address) view returns (uint256[])", params: [account.address] }) as bigint[];
                const batchNamePromises = batchIds.map(id => 
                    readContract({ contract, abi, method: "function getBatchInfo(uint256) view returns (uint256,address,string,string,string,string,string,string,bool)", params: [id] }).then(info => ({
                        id: id.toString(), batchId: id, name: info[3]
                    }))
                );
                const results = await Promise.all(batchNamePromises);
                const sortedByBatchId = results.sort((a, b) => a.batchId > b.batchId ? -1 : 1);
                const finalData = sortedByBatchId.map((batch, index) => ({ ...batch, localId: index + 1 }));
                setAllBatches(finalData);
            } catch (error) { console.error("Errore nel caricare i lotti dal contratto:", error); } 
            finally { setIsLoadingBatches(false); }
        };
        fetchAllBatches();
    }, [account?.address]);
    
    useEffect(() => {
        setFilteredBatches(
            searchTerm ? allBatches.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())) : allBatches
        );
    }, [searchTerm, allBatches]);

    const handleLogout = () => { if (account) disconnect(account.wallet); };
    
    const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, maxLength } = e.target;
        if (maxLength > 0 && value.length > maxLength) return;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setSelectedFile(file || null);
    };

    const handleInitializeBatch = async () => {
        if (!formData.name.trim()) {
            alert("Il campo Nome è obbligatorio.");
            return;
        }
        let imageIpfsHash = "N/A";
        setIsUploading(true);
        try {
            if (selectedFile) {
                const formDataForUpload = new FormData();
                formDataForUpload.append("image", selectedFile);
                const response = await fetch('/api/upload', { method: 'POST', body: formDataForUpload });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Errore durante l_upload dell_immagine.');
                imageIpfsHash = data.uri;
            }
            setIsUploading(false);

            const transaction = prepareContractCall({ 
                contract, abi, 
                method: "function initializeBatch(string,string,string,string,string)", 
                params: [formData.name, formData.description, formData.date, formData.location, imageIpfsHash] 
            });
            sendTransaction(transaction, { 
                onSuccess: () => { 
                    alert('✅ Iscrizione creata! La lista si aggiornerà a breve.');
                    setModal(null); setSelectedFile(null);
                },
                onError: (err) => alert(`❌ Errore nella transazione: ${err.message}`) 
            });
        } catch (error: any) {
            setIsUploading(false);
            alert(`❌ Fallimento: ${error.message}`);
        }
    };

    if (!account) {
        return (
            <div className='login-container'>
                <ConnectButton client={client} chain={polygon} accountAbstraction={{ chain: polygon, sponsorGas: true }} wallets={[inAppWallet()]} 
                    connectButton={{ label: "Connettiti / Log In", style: { fontSize: '1.2rem', padding: '1rem 2rem' } }}
                />
            </div>
        );
    }
    
    const renderDashboardContent = () => {
        if (isStatusLoading) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica stato account...</p>;
        const isActive = contributorData?.[2] ?? false;
        if (!isActive) return <RegistrationForm />;
        return (
            <>
                <DashboardHeader contributorInfo={contributorData!} onNewInscriptionClick={() => setModal('init')} />
                <div className="search-bar-container">
                    <input type="text" placeholder="Filtra iscrizioni per nome..." className="form-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                {isLoadingBatches ? <p>Caricamento iscrizioni...</p> : <BatchTable batches={filteredBatches} />}
            </>
        );
    };

    return (
        <div className="app-container-full">
            <header className="main-header-bar">
                <button onClick={handleLogout} className='logout-button-top-right'>Log Out / Esci</button>
            </header>
            <main className="main-content-full">
                {renderDashboardContent()}
            </main>

            {modal === 'init' && (
                <div className="modal-overlay" onClick={() => setModal(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2>Nuova Iscrizione</h2></div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Nome Iscrizione *</label>
                                <input type="text" name="name" value={formData.name} onChange={handleModalInputChange} className="form-input" maxLength={50} />
                                <small className="char-counter">{formData.name.length} / 50</small>
                            </div>
                            <div className="form-group">
                                <label>Descrizione</label>
                                <textarea name="description" value={formData.description} onChange={handleModalInputChange} className="form-input" rows={4} maxLength={500}></textarea>
                                <small className="char-counter">{formData.description.length} / 500</small>
                            </div>
                            <div className="form-group">
                                <label>Luogo</label>
                                <input type="text" name="location" value={formData.location} onChange={handleModalInputChange} className="form-input" maxLength={100} />
                                <small className="char-counter">{formData.location.length} / 100</small>
                            </div>
                             <div className="form-group">
                                <label>Data</label>
                                {/* MODIFICA: Aggiunto l'attributo 'max' per limitare la data */}
                                <input type="date" name="date" value={formData.date} onChange={handleModalInputChange} className="form-input" max={today} />
                             </div>
                             <div className="form-group">
                                <label>Immagine</label>
                                <input type="file" name="image" onChange={handleFileChange} className="form-input" accept="image/png, image/jpeg, image/gif"/>
                                {selectedFile && <p className="file-name-preview">File selezionato: {selectedFile.name}</p>}
                             </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setModal(null)} className="web3-button secondary">Chiudi</button>
                            <button onClick={handleInitializeBatch} disabled={isPending || isUploading} className="web3-button">
                                {isUploading ? "Caricamento..." : (isPending ? "Conferma..." : "Conferma")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}