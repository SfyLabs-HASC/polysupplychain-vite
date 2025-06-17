// FILE: src/pages/AziendaPage.tsx
// VERSIONE FINALE E COMPLETA CON CONNESSIONE A FIREBASE E BLOCKCHAIN

import React, { useState, useEffect, useMemo } from 'react';
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall, parseEventLogs, readContract } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { inAppWallet } from 'thirdweb/wallets';

// Importa l'ABI dal percorso corretto (salendo di una cartella)
import { supplyChainABI as abi } from '../abi/contractABI';
// Importa la configurazione di Firebase dal percorso corretto
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from "firebase/firestore";
// Importa il CSS dal percorso corretto
import '../App.css'; 

// --- Configurazione Centralizzata Thirdweb ---
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ 
  client, 
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});

// ==================================================================
// DEFINIZIONE DI TUTTI I COMPONENTI HELPER
// ==================================================================

// --- Componente: Form di Registrazione (se l'utente non è attivo) ---
const RegistrationForm = () => {
    // Il codice completo del tuo form di registrazione andrebbe qui.
    return (
        <div className="card">
            <h3>Benvenuto su Easy Chain!</h3>
            <p>Il tuo account non è ancora attivo. Compila il form di registrazione per inviare una richiesta di attivazione al nostro team.</p>
        </div>
    );
};

// --- Componente per la singola riga della tabella ---
const BatchRow = ({ metadata }: { metadata: BatchMetadata & { localId: number } }) => {
    const [showDescription, setShowDescription] = useState(false);

    const { data: batchInfo } = useReadContract({
      contract,
      abi,
      method: "function getBatchInfo(uint256 _batchId) view returns (uint256 id, address contributor, string contributorName, string name, string description, string date, string location, string imageIpfsHash, bool isClosed)",
      params: [metadata.batchId],
    });

    const { data: stepCount } = useReadContract({
      contract,
      abi,
      method: "function getBatchStepCount(uint256 _batchId) view returns (uint256)",
      params: [metadata.batchId]
    });
    
    const description = batchInfo ? batchInfo.description : "";

    return (
        <>
            <tr>
                <td>{metadata.localId}</td>
                <td>{batchInfo?.name ?? 'Caricamento...'}</td>
                <td>
                    {description ? (<button onClick={() => setShowDescription(true)} className="link-button">Leggi</button>) : (<span>-</span>)}
                </td>
                <td>{batchInfo?.date ?? '...'}</td>
                <td>{batchInfo?.location ?? '...'}</td>
                <td>{stepCount !== undefined ? stepCount.toString() : '...'}</td>
                <td>{batchInfo ? (batchInfo.isClosed ? <span className="status-closed">❌ Chiuso</span> : <span className="status-open">✅ Aperto</span>) : '...'}</td>
                <td><button className="web3-button" onClick={() => alert('Pronto per il Passaggio 2!')}>Visualizza</button></td>
            </tr>

            {showDescription && (
                <div className="modal-overlay" onClick={() => setShowDescription(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Descrizione del Lotto #{metadata.batchId.toString()}</h2>
                        <p style={{whiteSpace: 'pre-wrap', maxHeight: '60vh', overflowY: 'auto'}}>{description}</p>
                        <button onClick={() => setShowDescription(false)} className="web3-button" style={{marginTop: '1rem'}}>Chiudi</button>
                    </div>
                </div>
            )}
        </>
    );
};

// --- Interfaccia per i dati che leggiamo da Firebase ---
interface BatchMetadata {
  id: string; // ID del documento Firestore
  batchId: bigint;
  name: string;
  date: string;
  location: string;
  isClosed: boolean;
  ownerAddress: string;
}

// --- Componente principale della Tabella con Filtri e Paginazione ---
const BatchTable = () => {
    const account = useActiveAccount();
    const [allBatches, setAllBatches] = useState<(BatchMetadata & { localId: number })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({ sortOrder: 'desc', name: '', date: '', location: '', status: 'all' });
    const [itemsToShow, setItemsToShow] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const MAX_PER_PAGE = 30;

    useEffect(() => {
        if (!account?.address) {
            setIsLoading(false);
            return;
        }
        
        const fetchBatchesFromFirebase = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Logica di fetch reale da Firestore
                const batchesRef = collection(db, "batches");
                const q = query(batchesRef, where("ownerAddress", "==", account.address));
                const querySnapshot = await getDocs(q);

                const dataFromDb = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name,
                        date: data.date,
                        location: data.location,
                        isClosed: data.isClosed,
                        ownerAddress: data.ownerAddress,
                        batchId: BigInt(data.batchId) // Assicura che batchId sia un BigInt
                    }
                }) as Omit<BatchMetadata, 'id'> & { id: string }[];
                
                // Ordina per batchId DECRESCENTE per avere i più recenti prima
                const sortedByBatchId = dataFromDb.sort((a, b) => {
                    if (a.batchId > b.batchId) return -1;
                    if (a.batchId < b.batchId) return 1;
                    return 0;
                });

                // Aggiungi il localId dinamico
                const enrichedBatches = sortedByBatchId.map((batch, index) => ({
                    ...batch,
                    localId: index + 1
                }));

                setAllBatches(enrichedBatches);

            } catch (err) {
                setError("Impossibile caricare i dati da Firebase. Controlla le regole di sicurezza e la connessione.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBatchesFromFirebase();
    }, [account?.address]);

    const filteredAndSortedBatches = useMemo(() => {
        return allBatches
            .filter(b => 
                b.name.toLowerCase().includes(filters.name.toLowerCase()) &&
                b.location.toLowerCase().includes(filters.location.toLowerCase()) &&
                (filters.date ? b.date === filters.date : true) &&
                (filters.status === 'all' || (filters.status === 'open' && !b.isClosed) || (filters.status === 'closed' && b.isClosed))
            )
            .sort((a, b) => {
                return filters.sortOrder === 'desc' ? a.localId - b.localId : b.localId - a.localId;
            });
    }, [allBatches, filters]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSortedBatches.length / MAX_PER_PAGE));
    const startIndex = (currentPage - 1) * MAX_PER_PAGE;
    const itemsOnCurrentPage = filteredAndSortedBatches.slice(startIndex, startIndex + MAX_PER_PAGE);
    const visibleBatches = itemsOnCurrentPage.slice(0, itemsToShow);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setCurrentPage(1); 
        setItemsToShow(10);
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleLoadMore = () => setItemsToShow(prev => Math.min(prev + 10, MAX_PER_PAGE));
    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    if (isLoading) return <p>Caricamento dati lotti...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            <div className="filters-container">
                <input type="text" name="name" placeholder="Filtra per nome..." onChange={handleFilterChange} className="form-input"/>
                <input type="date" name="date" onChange={handleFilterChange} className="form-input"/>
                <input type="text" name="location" placeholder="Filtra per luogo..." onChange={handleFilterChange} className="form-input"/>
                <select name="status" onChange={handleFilterChange} className="form-input">
                    <option value="all">Tutti gli stati</option>
                    <option value="open">Aperto</option>
                    <option value="closed">Chiuso</option>
                </select>
                <select name="sortOrder" value={filters.sortOrder} onChange={handleFilterChange} className="form-input">
                    <option value="desc">Più Recenti (ID 1...)</option>
                    <option value="asc">Meno Recenti (...ID 1)</option>
                </select>
            </div>
            <table className="company-table">
                <thead><tr><th>ID</th><th>Nome</th><th>Descrizione</th><th>Data</th><th>Luogo</th><th>N° Passaggi</th><th>Stato</th><th>Azione</th></tr></thead>
                <tbody>
                    {visibleBatches.length > 0 ? (
                        visibleBatches.map(batch => <BatchRow key={batch.id} metadata={batch} />)
                    ) : (
                        <tr><td colSpan={8} style={{textAlign: 'center'}}>Nessun lotto trovato.</td></tr>
                    )}
                </tbody>
            </table>
            <div className="pagination-controls">
                {itemsToShow < itemsOnCurrentPage.length && (
                    <button onClick={handleLoadMore} className='link-button'>Vedi altri 10...</button>
                )}
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

// --- Componente Dashboard che combina Azioni Manuali e Tabella ---
const ActiveUserDashboard = () => {
    const [modal, setModal] = useState<'init' | 'add' | 'close' | null>(null);
    const [formData, setFormData] = useState({ batchName: "", batchDescription: "", stepName: "", stepDescription: "", stepLocation: "" });
    const [manualBatchId, setManualBatchId] = useState('');
    const { mutate: sendTransaction, isPending } = useSendTransaction();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTransactionSuccess = (receipt: any) => {
        setModal(null);
        alert('✅ Transazione confermata!');
        try {
            const events = parseEventLogs({ logs: receipt.logs, abi, eventName: "BatchInitialized" });
            if (events.length > 0) {
                const newBatchId = events[0].args.batchId;
                alert(`✅ Batch Inizializzato! ID recuperato: ${newBatchId}. Ora puoi usarlo per aggiungere step.`);
                setManualBatchId(newBatchId.toString());
            }
        } catch (e) { /* Ignora errori se l'evento non è quello che cerchiamo */ }
    };
    
    const handleInitializeBatch = () => {
        const transaction = prepareContractCall({ contract, abi, method: "function initializeBatch(string _name, string _description, string _date, string _location, string _imageIpfsHash)", params: [formData.batchName, formData.batchDescription, new Date().toLocaleDateString(), "Web App", "ipfs://..."] });
        sendTransaction(transaction, { onSuccess: handleTransactionSuccess, onError: (err) => alert(`❌ Errore: ${err.message}`) });
    };

    const handleAddStep = () => {
        if (!manualBatchId) { alert("Per favore, inserisci un ID Batch a cui aggiungere lo step."); return; }
        const transaction = prepareContractCall({ contract, abi, method: "function addStepToBatch(uint256 _batchId, string _eventName, string _description, string _date, string _location, string _attachmentsIpfsHash)", params: [BigInt(manualBatchId), formData.stepName, formData.stepDescription, new Date().toLocaleDateString(), formData.stepLocation, "ipfs://..."] });
        sendTransaction(transaction, { onSuccess: handleTransactionSuccess, onError: (err) => alert(`❌ Errore: ${err.message}`) });
    };

    const handleCloseBatch = () => {
        if (!manualBatchId) { alert("Per favore, inserisci un ID Batch da finalizzare."); return; }
        const transaction = prepareContractCall({ contract, abi, method: "function closeBatch(uint256 _batchId)", params: [BigInt(manualBatchId)] });
        sendTransaction(transaction, { onSuccess: handleTransactionSuccess, onError: (err) => alert(`❌ Errore: ${err.message}`) });
    };

    return (
        <div className="card">
            <h3 style={{color: '#34d399'}}>✅ ACCOUNT ATTIVATO</h3>
            <p>Benvenuto nella tua dashboard.</p>
            
            <div className='actions-section'>
                <h4>Azioni Rapide</h4>
                <div className="action-item"><button className="web3-button" onClick={() => setModal('init')}>1. Inizializza Nuovo Batch</button></div>
                <div className="action-item-manual">
                    <input type="number" value={manualBatchId} onChange={(e) => setManualBatchId(e.target.value)} placeholder="ID Batch Manuale" className="form-input" style={{width: '120px', marginRight: '1rem'}}/>
                    <div className='button-group'>
                        <button className="web3-button" onClick={() => setModal('add')}>2. Aggiungi Step</button>
                        <button className="web3-button" onClick={handleCloseBatch} style={{backgroundColor: '#ef4444'}}>3. Finalizza Batch</button>
                    </div>
                </div>
            </div>
            
            <hr style={{margin: '2rem 0', borderColor: '#27272a'}} />
            <BatchTable />

            {/* MODALI PER LE AZIONI */}
            {modal === 'init' && <div className="modal-overlay" onClick={() => setModal(null)}><div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Inizializza Nuovo Batch</h2><hr style={{margin: '1rem 0', borderColor: '#27272a'}}/>
                <div className="form-group"><label>Nome Lotto</label><input type="text" name="batchName" value={formData.batchName} onChange={handleInputChange} className="form-input" /></div>
                <div className="form-group" style={{marginTop: '1rem'}}><label>Descrizione</label><input type="text" name="batchDescription" value={formData.batchDescription} onChange={handleInputChange} className="form-input" /></div>
                <button onClick={handleInitializeBatch} disabled={isPending} className="web3-button" style={{marginTop: '1.5rem'}}>{isPending ? "In corso..." : "Conferma"}</button>
            </div></div>}
            {modal === 'add' && <div className="modal-overlay" onClick={() => setModal(null)}><div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Aggiungi Step al Batch #{manualBatchId}</h2><hr style={{margin: '1rem 0', borderColor: '#27272a'}}/>
                <div className="form-group"><label>Nome Step</label><input type="text" name="stepName" value={formData.stepName} onChange={handleInputChange} className="form-input" /></div>
                <div className="form-group" style={{marginTop: '1rem'}}><label>Descrizione</label><input type="text" name="stepDescription" value={formData.stepDescription} onChange={handleInputChange} className="form-input" /></div>
                <div className="form-group" style={{marginTop: '1rem'}}><label>Luogo</label><input type="text" name="stepLocation" value={formData.stepLocation} onChange={handleInputChange} className="form-input" /></div>
                <button onClick={handleAddStep} disabled={isPending || !manualBatchId} className="web3-button" style={{marginTop: '1.5rem'}}>{isPending ? "In corso..." : "Conferma"}</button>
            </div></div>}
            {/* Il modale per 'close' non è necessario perché non richiede input extra, viene chiamato direttamente */}
        </div>
    );
};


// ==================================================================
// COMPONENTE PRINCIPALE EXPORTATO
// ==================================================================
export default function AziendaPage() {
    const account = useActiveAccount();
    const { data: contributorData, isLoading: isStatusLoading } = useReadContract({
        contract,
        method: "function getContributorInfo(address _contributorAddress) view returns (string, uint256, bool)",
        params: account ? [account.address] : undefined,
        queryOptions: { enabled: !!account }
    });

    const isActive = contributorData ? contributorData[2] : false;
    const credits = contributorData ? contributorData[1].toString() : "N/A";

    const renderContent = () => {
        if (!account) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Connettiti per iniziare.</p>;
        if (isStatusLoading) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica dello stato dell'account...</p>;
        return isActive ? <ActiveUserDashboard /> : <RegistrationForm />;
    };

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-header"><h1 className="sidebar-title">Easy Chain</h1></div>
                {account && (
                    <div className="user-info">
                        <p><strong>Wallet Connesso:</strong></p><p style={{wordBreak: 'break-all'}}>{account.address}</p>
                        <hr style={{ borderColor: '#27272a', margin: '1rem 0' }}/>
                        <p><strong>Crediti Rimanenti:</strong></p><p>{isStatusLoading ? "..." : credits}</p>
                    </div>
                )}
            </aside>
            <main className="main-content">
                <header className="header">
                    <ConnectButton 
                        client={client} 
                        chain={polygon} 
                        accountAbstraction={{ 
                            chain: polygon, 
                            sponsorGas: true,
                        }} 
                        wallets={[inAppWallet()]} 
                    />
                </header>
                <h2 className="page-title">Portale Aziende - I Miei Lotti</h2>
                {renderContent()}
            </main>
        </div>
    );
}
