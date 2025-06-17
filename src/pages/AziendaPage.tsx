// FILE: src/pages/AziendaPage.tsx
// VERSIONE FINALE CON ARCHITETTURA 100% ON-CHAIN (SENZA FIREBASE)

import React, { useState, useEffect, useMemo } from 'react';
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction, readContract } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall, parseEventLogs } from 'thirdweb';
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

const RegistrationForm = () => { /* ... codice invariato ... */ return <div>Form di Registrazione</div>; };

const BatchRow = ({ batchId, localId }: { batchId: bigint; localId: number }) => {
    const [showDescription, setShowDescription] = useState(false);
    const { data: batchInfo } = useReadContract({ contract, abi, method: "function getBatchInfo(uint256 _batchId) view returns (uint256 id, address contributor, string contributorName, string name, string description, string date, string location, string imageIpfsHash, bool isClosed)", params: [batchId] });
    const { data: stepCount } = useReadContract({ contract, abi, method: "function getBatchStepCount(uint256 _batchId) view returns (uint256)", params: [batchId] });
    const description = batchInfo ? batchInfo.description : "";
    return (
        <>
            <tr>
                <td>{localId}</td>
                <td>{batchInfo?.name ?? 'Caricamento...'}</td>
                <td>{description ? (<button onClick={() => setShowDescription(true)} className="link-button">Leggi</button>) : (<span>-</span>)}</td>
                <td>{batchInfo?.date ?? '...'}</td>
                <td>{batchInfo?.location ?? '...'}</td>
                <td>{stepCount !== undefined ? stepCount.toString() : '...'}</td>
                <td>{batchInfo ? (batchInfo.isClosed ? <span className="status-closed">❌ Chiuso</span> : <span className="status-open">✅ Aperto</span>) : '...'}</td>
                <td><button className="web3-button" onClick={() => alert('Pronto per il Passaggio 2!')}>Visualizza</button></td>
            </tr>
            {showDescription && (
                <div className="modal-overlay" onClick={() => setShowDescription(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Descrizione del Lotto #{batchId.toString()}</h2>
                        <p style={{whiteSpace: 'pre-wrap', maxHeight: '60vh', overflowY: 'auto'}}>{description}</p>
                        <button onClick={() => setShowDescription(false)} className="web3-button" style={{marginTop: '1rem'}}>Chiudi</button>
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
    
    // Stato per la paginazione e ordinamento
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [itemsToShow, setItemsToShow] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const MAX_PER_PAGE = 30;

    // 1. CHIAMATA ON-CHAIN PER PRENDERE TUTTI GLI ID DEI BATCH
    useEffect(() => {
        if (!account?.address) {
            setIsLoading(false);
            return;
        }
        
        const fetchAllBatchIds = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await readContract({
                    contract,
                    abi,
                    method: "function getBatchesByContributor(address _contributor) view returns (uint256[])",
                    params: [account.address]
                }) as bigint[];

                // Ordiniamo gli ID dal più grande (recente) al più piccolo
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
    
    // 2. LOGICA DI FILTRAGGIO (SOLO ORDINAMENTO) E PAGINAZIONE
    const paginatedAndSortedBatches = useMemo(() => {
        // Applichiamo l'ordinamento scelto dall'utente
        const finalOrder = sortOrder === 'desc' 
            ? [...sortedBatchIds] // Già ordinato dal più recente
            : [...sortedBatchIds].reverse(); // Invertiamo per avere i meno recenti prima
        
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
        setItemsToShow(10); // Reset quando si cambia pagina
    };

    if (isLoading) return <p>Caricamento lotti dal contratto...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            <div className="filters-container">
                {/* I filtri di ricerca testo sono stati rimossi perché incompatibili con questo approccio */}
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
                            // 3. CALCOLO DEL LOCAL ID DINAMICO
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

const ActiveUserDashboard = () => {
    // Il codice delle Azioni Rapide e dei Modali va qui
    return (
        <div className="card">
            <h3 style={{color: '#34d399'}}>✅ ACCOUNT ATTIVATO</h3>
            <p>Benvenuto nella tua dashboard.</p>
            {/* Sezione Azioni Rapide... */}
            <hr style={{margin: '2rem 0', borderColor: '#27272a'}} />
            <BatchTable />
        </div>
    );
};

// --- Componente Principale della Pagina ---
export default function AziendaPage() {
    const account = useActiveAccount();
    const { data: contributorData, isLoading: isStatusLoading } = useReadContract({
        contract,
        method: "function getContributorInfo(address _contributorAddress) view returns (string, uint256, bool)",
        params: account ? [account.address] : undefined,
        queryOptions: { enabled: !!account }
    });
    const isActive = contributorData ? contributorData[2] : false;

    const renderContent = () => {
        if (!account) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Connettiti per iniziare.</p>;
        if (isStatusLoading) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica stato account...</p>;
        return isActive ? <ActiveUserDashboard /> : <RegistrationForm />;
    };

    return (
        <div className="app-container">
            <aside className="sidebar">{/* ... sidebar ... */}</aside>
            <main className="main-content">
                <header className="header">
                    <ConnectButton client={client} chain={polygon} accountAbstraction={{ chain: polygon, sponsorGas: true }} wallets={[inAppWallet()]} />
                </header>
                <h2 className="page-title">Portale Aziende - I Miei Lotti</h2>
                {renderContent()}
            </main>
        </div>
    );
}
