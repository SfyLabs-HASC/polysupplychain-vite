// FILE: src/pages/AziendaPage.tsx
// VERSIONE FINALE CON NUOVO LAYOUT GRAFICO E LOGICA DI FETCH ON-CHAIN RIPRISTINATA

import React, { useState, useEffect, useMemo } from 'react';
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction, readContract, useDisconnect } from 'thirdweb/react';
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

const BatchTable = ({ batches }: { batches: (BatchMetadata & { localId: number })[] }) => {
    const [itemsToShow, setItemsToShow] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const MAX_PER_PAGE = 30;

    const totalPages = Math.max(1, Math.ceil(batches.length / MAX_PER_PAGE));
    const startIndex = (currentPage - 1) * MAX_PER_PAGE;
    const itemsOnCurrentPage = batches.slice(startIndex, startIndex + MAX_PER_PAGE);
    const visibleBatches = itemsOnCurrentPage.slice(0, itemsToShow);

    const handleLoadMore = () => setItemsToShow(prev => Math.min(prev + 10, MAX_PER_PAGE));
    const handlePageChange = (page: number) => { if (page < 1 || page > totalPages) return; setCurrentPage(page); setItemsToShow(10); };
    
    // Reset quando cambiano i dati filtrati
    useEffect(() => {
        setCurrentPage(1);
        setItemsToShow(10);
    }, [batches]);

    return (
        <div>
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
    const [formData, setFormData] = useState({ batchName: "", batchDescription: "" });
    
    // Stato per i dati e filtri
    const [allBatches, setAllBatches] = useState<(BatchMetadata & { localId: number })[]>([]);
    const [filteredBatches, setFilteredBatches] = useState<(BatchMetadata & { localId: number })[]>([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // **LOGICA DI FETCH ON-CHAIN RIPRISTINATA**
    useEffect(() => {
        if (!account?.address) {
            setIsLoadingBatches(false);
            return;
        };

        const fetchAllBatches = async () => {
            setIsLoadingBatches(true);
            try {
                const batchIds = await readContract({ contract, abi, method: "function getBatchesByContributor(address _contributor) view returns (uint256[])", params: [account.address] }) as bigint[];
                
                // Per ogni ID, recuperiamo i metadati necessari per il filtro e l'ordinamento
                const batchPromises = batchIds.map(id => 
                    readContract({ contract, abi, method: "function getBatchInfo(uint256) view returns (uint256, address, string, string, string, string, string, string, bool)", params: [id] })
                );
                
                const results = await Promise.all(batchPromises);

                const enrichedData = results.map((data, index) => ({
                    id: batchIds[index].toString(),
                    batchId: batchIds[index],
                    name: data[3],
                    date: data[5],
                    location: data[6],
                    isClosed: data[8],
                }));

                // Ordina per batchId decrescente per l'assegnazione del localId
                const sortedByBatchId = enrichedData.sort((a, b) => a.batchId > b.batchId ? -1 : 1);

                const finalData = sortedByBatchId.map((batch, index) => ({
                    ...batch,
                    localId: index + 1
                }));

                setAllBatches(finalData);

            } catch (error) {
                console.error("Errore nel caricare i lotti dal contratto:", error);
            } finally {
                setIsLoadingBatches(false);
            }
        };

        fetchAllBatches();
    }, [account?.address]);
    
    // Logica di filtraggio
     useEffect(() => {
        if (!searchTerm) {
            setFilteredBatches(allBatches);
        } else {
            setFilteredBatches(
                allBatches.filter(batch => 
                    batch.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }
    }, [searchTerm, allBatches]);

    const handleLogout = () => {
        if (account) disconnect(account.wallet);
    };

    const handleInitializeBatch = () => {
        const transaction = prepareContractCall({ contract, abi, method: "function initializeBatch(string _name, string _description, string _date, string _location, string _imageIpfsHash)", params: [formData.batchName, formData.batchDescription, new Date().toLocaleDateString(), "Web App", "ipfs://..."] });
        sendTransaction(transaction, { 
            onSuccess: () => { 
                alert('✅ Iscrizione creata! La lista si aggiornerà a breve.');
                // Qui si potrebbe forzare un refresh
            },
            onError: (err) => alert(`❌ Errore: ${err.message}`) 
        });
        setModal(null);
    };

    // Layout per utente non connesso
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
        if (isStatusLoading) {
            return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica stato account...</p>;
        }

        const isActive = contributorData ? contributorData[2] : false;

        if (!isActive) {
             return <RegistrationForm />;
        }
        
        return (
            <>
                <DashboardHeader contributorInfo={contributorData!} onNewInscriptionClick={() => setModal('init')} />
                <div className="search-bar-container">
                    <input type="text" placeholder="Filtra iscrizioni per nome..." className="form-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                {isLoadingBatches ? (
                    <p>Caricamento iscrizioni...</p>
                ) : (
                    <BatchTable batches={filteredBatches} />
                )}
            </>
        );
    };

    // Layout per utente connesso
    return (
        <div className="app-container-full">
            <header className="main-header-bar">
                <button onClick={handleLogout} className='logout-button-top-right'>Log Out / Esci</button>
            </header>
            <main className="main-content-full">
                {renderDashboardContent()}
            </main>

            {/* MODALE PER NUOVA ISCRIZIONE */}
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
        </div>
    );
}

interface BatchMetadata { id: string; batchId: bigint; name: string; date: string; location: string; isClosed: boolean; }
