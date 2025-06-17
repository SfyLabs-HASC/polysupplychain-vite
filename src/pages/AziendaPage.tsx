// FILE: src/pages/AziendaPage.tsx
// VERSIONE CON UX AGGIORNATA: VALIDAZIONE, FORMATO DATA, TOOLTIP DESCRIZIONE, LIMITI CARATTERI E UPLOAD IMMAGINE

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

const BatchRow = ({ batchId, localId }: { batchId: bigint; localId: number }) => {
    const { data: batchInfo } = useReadContract({ contract, abi, method: "function getBatchInfo(uint256 _batchId) view returns (uint256 id, address contributor, string contributorName, string name, string description, string date, string location, string imageIpfsHash, bool isClosed)", params: [batchId] });
    const { data: stepCount } = useReadContract({ contract, abi, method: "function getBatchStepCount(uint256 _batchId) view returns (uint256)", params: [batchId] });
    
    const name = batchInfo?.[3];
    const description = batchInfo?.[4];
    const dateRaw = batchInfo?.[5];
    const location = batchInfo?.[6];
    const isClosed = batchInfo?.[8];

    // Funzione per formattare la data
    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return '/';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr; // Ritorna la data originale se non è nel formato atteso
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    return (
        <tr>
            <td>{localId}</td>
            {/* MODIFICA: La descrizione ora è un tooltip sul nome */}
            <td className="name-cell" title={description || 'Nessuna descrizione'}>
                {name || '/'}
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
    );
};

interface BatchMetadata { id: string; batchId: bigint; name: string; }

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
                {/* MODIFICA: Rimuoviamo la colonna Descrizione dall'header */}
                <thead><tr><th>ID</th><th>Nome</th><th>Data</th><th>Luogo</th><th>N° Passaggi</th><th>Stato</th><th>Azione</th></tr></thead>
                <tbody>
                    {visibleBatches.length > 0 ? (
                        visibleBatches.map(batch => <BatchRow key={batch.id} batchId={batch.batchId} localId={batch.localId} />)
                    ) : (
                        <tr><td colSpan={7} style={{textAlign: 'center'}}>Nessuna iscrizione trovata.</td></tr>
                    )}
                </tbody>
            </table>
            <div className="pagination-controls">{/* ... paginazione ... */}</div>
        </div>
    );
};

const DashboardHeader = ({ contributorInfo, onNewInscriptionClick }: { contributorInfo: readonly [string, bigint, boolean], onNewInscriptionClick: () => void }) => {
    //... Componente invariato ...
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
    const [allBatches, setAllBatches] = useState<(BatchMetadata & { localId: number })[]>([]);
    const [filteredBatches, setFilteredBatches] = useState<(BatchMetadata & { localId: number })[]>([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Stato per il form di Nuova Iscrizione
    const [formData, setFormData] = useState({ 
        name: "", 
        description: "",
        date: new Date().toISOString().split('T')[0],
        location: "",
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Fetch on-chain dei dati... (logica invariata)
    useEffect(() => { /* ... */ }, [account?.address]);
    
    // Filtraggio... (logica invariata)
    useEffect(() => { /* ... */ }, [searchTerm, allBatches]);

    const handleLogout = () => { if (account) disconnect(account.wallet); };
    
    const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, maxLength } = e.target;
        // Applica il limite di caratteri
        if (maxLength > 0 && value.length > maxLength) {
            return;
        }
        setFormData(prev => ({...prev, [name]: value}));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleInitializeBatch = async () => {
        if (!formData.name) {
            alert("Il campo Nome è obbligatorio.");
            return;
        }

        let imageIpfsHash = "N/A";

        // *** LOGICA DI UPLOAD IPFS (Placeholder) ***
        // In un'app reale, qui chiameresti una funzione per caricare 'selectedFile' su IPFS
        // e ottenere l'hash. Esempio con un servizio di storage:
        // if (selectedFile) {
        //   setIsUploading(true);
        //   const uploadResult = await yourIpfsUploadFunction(selectedFile);
        //   imageIpfsHash = uploadResult.ipfsHash;
        //   setIsUploading(false);
        // }

        const transaction = prepareContractCall({ 
            contract, abi, 
            method: "function initializeBatch(string,string,string,string,string)", 
            params: [formData.name, formData.description, formData.date, formData.location, imageIpfsHash] 
        });
        sendTransaction(transaction, { 
            onSuccess: () => { 
                alert('✅ Iscrizione creata! La lista si aggiornerà a breve.');
                setModal(null);
                setSelectedFile(null);
                setPreviewUrl(null);
            },
            onError: (err) => alert(`❌ Errore: ${err.message}`) 
        });
    };

    if (!account) { /* ... Layout di Login ... */ }
    
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

            {/* MODALE NUOVA ISCRIZIONE AGGIORNATO */}
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
                                <input type="date" name="date" value={formData.date} onChange={handleModalInputChange} className="form-input" />
                            </div>
                             <div className="form-group">
                                <label>Immagine</label>
                                <input type="file" name="image" onChange={handleFileChange} className="form-input" accept="image/png, image/jpeg, image/gif"/>
                                {previewUrl && <img src={previewUrl} alt="Anteprima" className="image-preview" />}
                             </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setModal(null)} className="web3-button secondary">Chiudi</button>
                            <button onClick={handleInitializeBatch} disabled={isPending} className="web3-button">{isPending ? "In corso..." : "Conferma"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

