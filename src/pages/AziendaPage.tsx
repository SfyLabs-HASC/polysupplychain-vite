// FILE: src/pages/AziendaPage.tsx
// VERSIONE FINALE E COMPLETA CON CORREZIONE DEFINITIVA AGLI IMPORT

import React, { useState, useEffect, useMemo } from 'react';
// MODIFICA: 'readContract' è stato rimosso da questo import
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction, useDisconnect } from 'thirdweb/react';
// MODIFICA: 'readContract' è stato aggiunto a questo import
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
// DEFINIZIONE DI TUTTI I COMPONENTI HELPER
// ==================================================================

const RegistrationForm = () => {
    return (
        <div className="card">
            <h3>Benvenuto su Easy Chain!</h3>
            <p>Il tuo account non è ancora attivo. Compila il form di registrazione per inviare una richiesta di attivazione.</p>
        </div>
    );
};

// --- MODIFICA QUI: Il popup della descrizione ora ha uno stile migliorato ---
const BatchRow = ({ batchId, localId }: { batchId: bigint; localId: number }) => {
    const [showDescription, setShowDescription] = useState(false);
    const { data: batchInfo } = useReadContract({ contract, abi, method: "function getBatchInfo(uint256 _batchId) view returns (uint256 id, address contributor, string contributorName, string name, string description, string date, string location, string imageIpfsHash, bool isClosed)", params: [batchId] });
    const { data: stepCount } = useReadContract({ contract, abi, method: "function getBatchStepCount(uint256 _batchId) view returns (uint256)", params: [batchId] });
    
    const name = batchInfo?.[3];
    const description = batchInfo?.[4];
    const date = batchInfo?.[5];
    const location = batchInfo?.[6];
    const isClosed = batchInfo?.[8];

    return (
        <>
            <tr>
                <td>{localId}</td>
                <td>{name || '/'}</td>
                <td><button onClick={() => setShowDescription(true)} className="link-button">Leggi</button></td>
                <td>{date || '/'}</td>
                <td>{location || '/'}</td>
                <td>{stepCount !== undefined ? stepCount.toString() : '/'}</td>
                <td>
                    {batchInfo ? (
                        isClosed ? <span className="status-closed">✅ Chiuso</span> : <span className="status-open">⏳ Aperto</span>
                    ) : '...'}
                </td>
                <td><button className="web3-button" onClick={() => alert('Pronto per il Passaggio 2!')}>Visualizza</button></td>
            </tr>
            {showDescription && (
                <div className="modal-overlay" onClick={() => setShowDescription(false)}>
                    <div className="modal-content description-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                          <h2>Descrizione Iscrizione / Lotto</h2>
                        </div>
                        <div className="modal-body">
                          <p>{description || 'Nessuna descrizione fornita.'}</p>
                        </div>
                        <div className="modal-footer">
                          <button onClick={() => setShowDescription(false)} className="web3-button">Chiudi</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const BatchTable = () => {
    const account = useActiveAccount();
    const [sortedBatchIds, setSortedBatchIds] = useState<bigint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [itemsToShow, setItemsToShow] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const MAX_PER_PAGE = 30;

    useEffect(() => {
        if (!account?.address) {
            setIsLoading(false);
            return;
        }
        
        const fetchAllBatchIds = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await readContract({ contract, abi, method: "function getBatchesByContributor(address _contributor) view returns (uint256[])", params: [account.address] }) as bigint[];
                const sortedIds = data.sort((a, b) => (a > b ? -1 : 1));
                setSortedBatchIds(sortedIds);
            } catch (err: any) {
                setError("Impossibile caricare i lotti dal contratto.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllBatchIds();
    }, [account?.address]);
    
    const paginatedAndSortedBatches = useMemo(() => {
        const finalOrder = sortOrder === 'desc' ? [...sortedBatchIds] : [...sortedBatchIds].reverse(); 
        return finalOrder;
    }, [sortedBatchIds, sortOrder]);

    const totalPages = Math.max(1, Math.ceil(paginatedAndSortedBatches.length / MAX_PER_PAGE));
    const startIndex = (currentPage - 1) * MAX_PER_PAGE;
    const itemsOnCurrentPage = paginatedAndSortedBatches.slice(startIndex, startIndex + MAX_PER_PAGE);
    const visibleBatchIds = itemsOnCurrentPage.slice(0, itemsToShow);

    const handleLoadMore = () => setItemsToShow(prev => Math.min(prev + 10, MAX_PER_PAGE));
    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        setItemsToShow(10);
    };

    if (isLoading) return <p>Caricamento lotti dal contratto...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            <div className="filters-container">
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')} className="form-input">
                    <option value="desc">Più Recenti</option>
                    <option value="asc">Meno Recenti</option>
                </select>
            </div>
            <table className="company-table">
                <thead><tr><th>ID</th><th>Nome</th><th>Descrizione</th><th>Data</th><th>Luogo</th><th>N° Passaggi</th><th>Stato</th><th>Azione</th></tr></thead>
                <tbody>
                    {visibleBatchIds.length > 0 ? (
                        visibleBatchIds.map((batchId, index) => {
                            const globalIndex = startIndex + index;
                            const localId = sortOrder === 'desc' ? globalIndex + 1 : sortedBatchIds.length - globalIndex;
                            return <BatchRow key={batchId.toString()} batchId={batchId} localId={localId} />
                        })
                    ) : (
                        <tr><td colSpan={8} style={{textAlign: 'center'}}>Nessun lotto trovato.</td></tr>
                    )}
                </tbody>
            </table>
            <div className="pagination-controls">
                {itemsToShow < itemsOnCurrentPage.length && ( <button onClick={handleLoadMore} className='link-button'>Vedi altri 10...</button> )}
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

const ActiveUserDashboard = ({ contributorInfo }: { contributorInfo: readonly [string, bigint, boolean] }) => {
    const { mutate: sendTransaction, isPending } = useSendTransaction();
    const [modal, setModal] = useState<'init' | 'add' | 'close' | null>(null);
    const [formData, setFormData] = useState({ batchName: "", batchDescription: "", stepName: "", stepDescription: "", stepLocation: "" });
    const [manualBatchId, setManualBatchId] = useState('');

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
            {/* Sezione Azioni Rapide */}
            <div className='actions-section'>
                <h4>Azioni Rapide</h4>
                <div className="action-item">
                    <button className="web3-button" onClick={() => setModal('init')}>1. Inizializza Nuova Iscrizione</button>
                </div>
                <div className="action-item-manual">
                    <input type="number" value={manualBatchId} onChange={(e) => setManualBatchId(e.target.value)} placeholder="ID Iscrizione Manuale" className="form-input" style={{width: '120px', marginRight: '1rem'}}/>
                    <div className='button-group'>
                        <button className="web3-button" onClick={() => setModal('add')}>2. Aggiungi Step</button>
                        <button className="web3-button" onClick={handleCloseBatch} style={{backgroundColor: '#ef4444'}}>3. Finalizza Iscrizione</button>
                    </div>
                </div>
            </div>
            
            <hr style={{margin: '2rem 0', borderColor: '#27272a'}} />
            <BatchTable />

            {/* MODALI PER LE AZIONI */}
            {modal === 'init' && <div className="modal-overlay" onClick={() => setModal(null)}><div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Inizializza Nuova Iscrizione</h2><hr style={{margin: '1rem 0', borderColor: '#27272a'}}/>
                <div className="form-group"><label>Nome Iscrizione</label><input type="text" name="batchName" value={formData.batchName} onChange={handleInputChange} className="form-input" /></div>
                <div className="form-group" style={{marginTop: '1rem'}}><label>Descrizione</label><input type="text" name="batchDescription" value={formData.batchDescription} onChange={handleInputChange} className="form-input" /></div>
                <button onClick={handleInitializeBatch} disabled={isPending} className="web3-button" style={{marginTop: '1.5rem'}}>{isPending ? "In corso..." : "Conferma"}</button>
            </div></div>}
            {modal === 'add' && <div className="modal-overlay" onClick={() => setModal(null)}><div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Aggiungi Step a Iscrizione #{manualBatchId}</h2><hr style={{margin: '1rem 0', borderColor: '#27272a'}}/>
                <div className="form-group"><label>Nome Step</label><input type="text" name="stepName" value={formData.stepName} onChange={handleInputChange} className="form-input" /></div>
                <div className="form-group" style={{marginTop: '1rem'}}><label>Descrizione</label><input type="text" name="stepDescription" value={formData.stepDescription} onChange={handleInputChange} className="form-input" /></div>
                <div className="form-group" style={{marginTop: '1rem'}}><label>Luogo</label><input type="text" name="stepLocation" value={formData.stepLocation} onChange={handleInputChange} className="form-input" /></div>
                <button onClick={handleAddStep} disabled={isPending || !manualBatchId} className="web3-button" style={{marginTop: '1.5rem'}}>{isPending ? "In corso..." : "Conferma"}</button>
            </div></div>}
        </div>
    );
};

const UserHeader = ({ contributorInfo }: { contributorInfo: readonly [string, bigint, boolean] }) => {
    const account = useActiveAccount();
    const { disconnect } = useDisconnect();

    const companyName = contributorInfo[0] || 'Azienda';
    const credits = contributorInfo[1].toString();
    const isActive = contributorInfo[2];

    const handleLogout = () => {
        if (account) {
            disconnect(account.wallet);
        }
    };

    return (
        <div className='user-header-card'>
            <div className='info-details'>
                <h3>Benvenuto, {companyName}</h3>
                <div className='info-row'>
                    <span><strong>Stato:</strong> <span className='status-active'>ATTIVO</span> ({credits} crediti rimasti)</span>
                </div>
                <div className='info-row'>
                    <span title={account?.address}><strong>Wallet:</strong> {account?.address.slice(0, 6)}...{account?.address.slice(-4)}</span>
                </div>
            </div>
            <button onClick={handleLogout} className='logout-button'>Logout</button>
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

    // Se l'utente non è connesso, mostra la pagina di login centrale
    if (!account) {
        return (
            <div className='login-container'>
                <ConnectButton 
                    client={client} 
                    chain={polygon} 
                    accountAbstraction={{ chain: polygon, sponsorGas: true }} 
                    wallets={[inAppWallet()]} 
                    connectButton={{
                        label: "Connettiti / Log In",
                        style: {
                            fontSize: '1.2rem',
                            padding: '1rem 2rem',
                        }
                    }}
                />
            </div>
        );
    }
    
    // Se l'utente è connesso, mostra il layout completo della dashboard
    const renderDashboardContent = () => {
        if (isStatusLoading) {
            return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica stato account...</p>;
        }

        const isActive = contributorData ? contributorData[2] : false;

        if (!isActive) {
             return <RegistrationForm />;
        }
        
        return <ActiveUserDashboard contributorInfo={contributorData!} />;
    };

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h1 className="sidebar-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '0.5rem', verticalAlign: 'middle'}}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>
                        Easy Chain
                    </h1>
                </div>
            </aside>
            <main className="main-content">
                <header className="header">
                    <h2 className="page-title">Portale Aziende - Le mie Iscrizioni</h2>
                    {contributorData && <UserHeader contributorInfo={contributorData} />}
                </header>
                {renderDashboardContent()}
            </main>
        </div>
    );
}
