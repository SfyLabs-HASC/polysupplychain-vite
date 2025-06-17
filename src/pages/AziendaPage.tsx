// FILE: src/pages/AziendaPage.tsx
// VERSIONE FINALE CON PATH DI IMPORT CORRETTO

import React, { useState, useEffect, useMemo } from 'react';
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall, parseEventLogs, readContract } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { inAppWallet } from 'thirdweb/wallets';
import { supplyChainABI as abi } from '../abi/contractABI'; // <-- MODIFICA QUI: da './' a '../'
import './App.css'; 

// --- Configurazione Centralizzata ---
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ 
  client, 
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});

// ==================================================================
// IL RESTO DEL FILE È IDENTICO A PRIMA
// ==================================================================

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
        if (!account?.address) return;
        
        const fetchBatchesFromFirebase = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // ** LOGICA DI FETCH DA FIREBASE VA QUI **
                console.log("Simulo fetch da Firebase per:", account.address);
                await new Promise(resolve => setTimeout(resolve, 1000));

                const mockDataFromDb: Omit<BatchMetadata, 'id'>[] = [
                    { batchId: BigInt(5), name: 'Lotto Olio Extravergine', date: '2025-01-10', location: 'Frantoio A', isClosed: false },
                    { batchId: BigInt(300), name: 'Partita Grano Duro', date: '2025-03-20', location: 'Campo 1', isClosed: false },
                    { batchId: BigInt(20), name: 'Vino Riserva 2022', date: '2025-02-05', location: 'Cantina B', isClosed: true },
                    { batchId: BigInt(400), name: 'Formaggio Pecorino', date: '2025-04-15', location: 'Caseificio C', isClosed: false },
                ];

                const sortedByBatchId = mockDataFromDb.sort((a, b) => {
                    if (a.batchId > b.batchId) return -1;
                    if (a.batchId < b.batchId) return 1;
                    return 0;
                });

                const enrichedBatches = sortedByBatchId.map((batch, index) => ({
                    ...batch,
                    id: `mock-${batch.batchId}`,
                    localId: index + 1
                }));

                setAllBatches(enrichedBatches);

            } catch (err) {
                setError("Impossibile caricare i dati.");
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

    const totalPages = Math.ceil(filteredAndSortedBatches.length / MAX_PER_PAGE);
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

    if (isLoading) return <p>Caricamento dati...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            <div className="filters-container">{/* Filtri */}</div>
            <table className="company-table">{/* Tabella */}
                <thead><tr><th>ID</th><th>Nome</th><th>Descrizione</th><th>Data</th><th>Luogo</th><th>N° Passaggi</th><th>Stato</th><th>Azione</th></tr></thead>
                <tbody>
                    {visibleBatches.length > 0 ? (
                        visibleBatches.map(batch => <BatchRow key={batch.id} metadata={batch} />)
                    ) : (
                        <tr><td colSpan={8} style={{textAlign: 'center'}}>Nessun risultato trovato.</td></tr>
                    )}
                </tbody>
            </table>
            <div className="pagination-controls">{/* Paginazione */}</div>
        </div>
    );
};

// --- Componente Dashboard che contiene la tabella e le azioni ---
const ActiveUserDashboard = () => (
    <div className="card">
        {/* Qui potremmo rimettere la sezione Azioni Rapide se necessario */}
        <BatchTable />
    </div>
);

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
    const credits = contributorData ? contributorData[1].toString() : "N/A";

    const renderContent = () => {
        if (!account) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Connettiti per iniziare.</p>;
        if (isStatusLoading) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica dello stato dell'account...</p>;
        return isActive ? <ActiveUserDashboard /> : <div>Il form di registrazione va qui.</div>;
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