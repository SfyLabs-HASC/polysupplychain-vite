// FILE: src/pages/AziendaPage.tsx
// VERSIONE FINALE CON CORREZIONE DEFINITIVA AGLI IMPORT E TUTTE LE FEATURE

import React, { useState, useEffect, useMemo } from 'react';
// MODIFICA CORRETTA: Qui ci sono solo gli HOOKS e i COMPONENTI di React
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction, useDisconnect } from 'thirdweb/react';
// MODIFICA CORRETTA: Qui ci sono le FUNZIONI CORE, incluso readContract
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
    const [modal, setModal] = useState<'init' | null>(null);
    const [formData, setFormData] = useState({ batchName: "", batchDescription: "" });

    const handleInitializeBatch = () => {
        const transaction = prepareContractCall({ contract, abi, method: "function initializeBatch(string _name, string _description, string _date, string _location, string _imageIpfsHash)", params: [formData.batchName, formData.batchDescription, new Date().toLocaleDateString(), "Web App", "ipfs://..."] });
        sendTransaction(transaction, { 
            onSuccess: () => { 
                alert('✅ Iscrizione creata! La lista si aggiornerà a breve.');
                setModal(null);
                // Potremmo voler forzare un refresh della lista qui
            },
            onError: (err) => alert(`❌ Errore: ${err.message}`) 
        });
    };

    return (
        <>
            <DashboardHeader contributorInfo={contributorInfo} onNewInscriptionClick={() => setModal('init')} />
            <div className="search-bar-container">
                {/* La logica di ricerca va implementata qui se necessaria */}
                 <input type="text" placeholder="Filtra iscrizioni..." className="form-input" disabled />
            </div>
            <BatchTable />

            {modal === 'init' && (
                <div className="modal-overlay" onClick={() => setModal(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2>Nuova Iscrizione</h2></div>
                        <div className="modal-body">
                            <div className="form-group"><label>Nome Iscrizione</label><input type="text" name="batchName" value={formData.batchName} onChange={(e) => setFormData({...formData, batchName: e.target.value})} className="form-input" /></div>
                            <div className="form-group" style={{marginTop: '1rem'}}><label>Descrizione</label><input type="text" name="batchDescription" value={formData.batchDescription} onChange={(e) => setFormData({...formData, batchDescription: e.target.value})} className="form-input" /></div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={handleInitializeBatch} disabled={isPending} className="web3-button">{isPending ? "In corso..." : "Conferma"}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
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
    const { data: contributorData, isLoading: isStatusLoading } = useReadContract({
        contract,
        method: "function getContributorInfo(address _contributorAddress) view returns (string, uint256, bool)",
        params: account ? [account.address] : undefined,
        queryOptions: { enabled: !!account }
    });

    const handleLogout = () => {
        if (account) {
            disconnect(account.wallet);
        }
    };

    // Layout per utente non connesso
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
    
    // Layout per utente connesso
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
        <div className="app-container-full">
            <header className="main-header-bar">
                <button onClick={handleLogout} className='logout-button-top-right'>Log Out / Esci</button>
            </header>
            <main className="main-content-full">
                {renderDashboardContent()}
            </main>
        </div>
    );
}
