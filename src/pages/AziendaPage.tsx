// FILE: src/pages/AziendaPage.tsx
// VERSIONE FINALE CON AZIONI MANUALI PER TEST E TABELLA DI VISUALIZZAZIONE

import React, { useState, useEffect, useMemo } from 'react';
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall, parseEventLogs } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { inAppWallet } from 'thirdweb/wallets';
import { supplyChainABI as abi } from './abi/contractABI';
import './App.css'; // Assicurati di avere gli stili CSS per la tabella e i popup

// --- Configurazione Centralizzata ---
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ 
  client, 
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});

// ==================================================================
// DEFINIZIONE DI TUTTI I COMPONENTI DELLA PAGINA
// ==================================================================

// --- Componente: Form di Registrazione (se l'utente non è attivo) ---
const RegistrationForm = () => {
    // Il codice di questo componente rimane invariato
    return (
        <div className="card">
            <h3>Benvenuto su Easy Chain!</h3>
            <p>Il tuo account non è ancora attivo. Compila il form per inviare una richiesta di attivazione.</p>
            {/* ... JSX del form di registrazione ... */}
        </div>
    );
};

// --- Componente: Modale Generico ---
const FormModal = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
    <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{title}</h2>
            <hr style={{margin: '1rem 0', borderColor: '#27272a'}}/>
            {children}
            {/* Il pulsante Annulla è stato rimosso per lasciare il controllo al componente padre */}
        </div>
    </div>
);


// --- Componente per la singola riga della tabella ---
const BatchRow = ({ metadata }: { metadata: BatchMetadata & { localId: number } }) => {
    // ... Il codice di questo componente è invariato rispetto all'ultima versione ...
    const [showDescription, setShowDescription] = useState(false);
    const { data: batchInfo } = useReadContract({ contract, abi, method: "function getBatchInfo(uint256 _batchId) view returns (uint256 id, address contributor, string contributorName, string name, string description, string date, string location, string imageIpfsHash, bool isClosed)", params: [metadata.batchId], });
    const { data: stepCount } = useReadContract({ contract, abi, method: "function getBatchStepCount(uint256 _batchId) view returns (uint256)", params: [metadata.batchId] });
    const description = batchInfo ? batchInfo.description : "";
    return (
        <>
            <tr>
                <td>{metadata.localId}</td><td>{batchInfo?.name ?? '...'}</td>
                <td>{description ? (<button onClick={() => setShowDescription(true)} className="link-button">Leggi</button>) : (<span>-</span>)}</td>
                <td>{batchInfo?.date ?? '...'}</td><td>{batchInfo?.location ?? '...'}</td><td>{stepCount !== undefined ? stepCount.toString() : '...'}</td>
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
    id: string; batchId: bigint; name: string; date: string; location: string; isClosed: boolean;
}

// --- Componente principale della Tabella con Filtri e Paginazione ---
const BatchTable = () => {
    // ... Il codice di questo componente è invariato rispetto all'ultima versione ...
    const account = useActiveAccount();
    const [allBatches, setAllBatches] = useState<(BatchMetadata & { localId: number })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ sortOrder: 'desc', name: '', date: '', location: '', status: 'all' });
    const [itemsToShow, setItemsToShow] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const MAX_PER_PAGE = 30;

    useEffect(() => {
        if (!account?.address) return;
        const fetchBatchesFromFirebase = async () => { /* ... Logica di fetch da Firebase ... */ };
        fetchBatchesFromFirebase();
    }, [account?.address]);

    const filteredAndSortedBatches = useMemo(() => { /* ... Logica di filtri e ordinamento ... */ return allBatches.sort(/*...*/); }, [allBatches, filters]);
    const totalPages = Math.ceil(filteredAndSortedBatches.length / MAX_PER_PAGE);
    const startIndex = (currentPage - 1) * MAX_PER_PAGE;
    const itemsOnCurrentPage = filteredAndSortedBatches.slice(startIndex, startIndex + MAX_PER_PAGE);
    const visibleBatches = itemsOnCurrentPage.slice(0, itemsToShow);
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { /*...*/ };
    const handleLoadMore = () => setItemsToShow(prev => Math.min(prev + 10, MAX_PER_PAGE));
    const handlePageChange = (page: number) => { /*...*/ };

    if (isLoading) return <p>Caricamento dati...</p>;
    return (
        <div>
            <div className="filters-container">{/* Filtri */}</div>
            <table className="company-table">{/* Tabella */}
                <thead><tr><th>ID</th><th>Nome</th><th>Descrizione</th><th>Data</th><th>Luogo</th><th>N° Passaggi</th><th>Stato</th><th>Azione</th></tr></thead>
                <tbody>{visibleBatches.map(batch => <BatchRow key={batch.id} metadata={batch} />)}</tbody>
            </table>
            <div className="pagination-controls">{/* Paginazione */}</div>
        </div>
    );
};

// --- Componente Dashboard che combina Azioni Manuali e Tabella di Visualizzazione ---
const ActiveUserDashboard = () => {
    const [modal, setModal] = useState<'init' | 'add' | 'close' | null>(null);
    const [formData, setFormData] = useState({ batchName: "", batchDescription: "", stepName: "", stepDescription: "", stepLocation: "" });
    
    // NUOVO STATO per l'ID manuale
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
                setManualBatchId(newBatchId.toString()); // Aggiorna automaticamente il campo manuale
            }
        } catch (e) {
            // Non fare nulla se l'evento non è BatchInitialized
        }
    };
    
    // Handler per le transazioni che ora usano 'manualBatchId'
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
            
            {/* NUOVA SEZIONE PER LE AZIONI MANUALI */}
            <div className='actions-section'>
                <h4>Azioni Rapide</h4>
                <div className="action-item">
                    <button className="web3-button" onClick={() => setModal('init')}>1. Inizializza Nuovo Batch</button>
                </div>
                <div className="action-item-manual">
                    <input 
                        type="number" 
                        value={manualBatchId}
                        onChange={(e) => setManualBatchId(e.target.value)}
                        placeholder="ID Batch"
                        className="form-input"
                        style={{width: '120px', marginRight: '1rem'}}
                    />
                    <div className='button-group'>
                        <button className="web3-button" onClick={() => setModal('add')}>2. Aggiungi Step</button>
                        <button className="web3-button" onClick={() => setModal('close')} style={{backgroundColor: '#ef4444'}}>3. Finalizza Batch</button>
                    </div>
                </div>
            </div>
            
            <hr style={{margin: '2rem 0', borderColor: '#27272a'}} />
            <BatchTable />

            {/* MODALI PER LE AZIONI */}
            {modal === 'init' && <FormModal title="Inizializza Nuovo Batch" onClose={() => setModal(null)}>
                <div className="form-group"><label>Nome Lotto</label><input type="text" name="batchName" value={formData.batchName} onChange={handleInputChange} className="form-input" /></div>
                <div className="form-group" style={{marginTop: '1rem'}}><label>Descrizione</label><input type="text" name="batchDescription" value={formData.batchDescription} onChange={handleInputChange} className="form-input" /></div>
                <button onClick={handleInitializeBatch} disabled={isPending} className="web3-button" style={{marginTop: '1.5rem'}}>{isPending ? "In corso..." : "Conferma"}</button>
            </FormModal>}
            {modal === 'add' && <FormModal title={`Aggiungi Step al Batch #${manualBatchId}`} onClose={() => setModal(null)}>
                <div className="form-group"><label>Nome Step</label><input type="text" name="stepName" value={formData.stepName} onChange={handleInputChange} className="form-input" /></div>
                <div className="form-group" style={{marginTop: '1rem'}}><label>Descrizione</label><input type="text" name="stepDescription" value={formData.stepDescription} onChange={handleInputChange} className="form-input" /></div>
                <div className="form-group" style={{marginTop: '1rem'}}><label>Luogo</label><input type="text" name="stepLocation" value={formData.stepLocation} onChange={handleInputChange} className="form-input" /></div>
                <button onClick={handleAddStep} disabled={isPending || !manualBatchId} className="web3-button" style={{marginTop: '1.5rem'}}>{isPending ? "In corso..." : "Conferma"}</button>
            </FormModal>}
            {modal === 'close' && <FormModal title={`Finalizza Batch #${manualBatchId}`} onClose={() => setModal(null)}>
                <p>Sei sicuro di voler finalizzare questo batch? L'azione è irreversibile.</p>
                <button onClick={handleCloseBatch} disabled={isPending || !manualBatchId} className="web3-button" style={{backgroundColor: '#ef4444'}}>{isPending ? "In corso..." : "Conferma Finalizzazione"}</button>
            </FormModal>}
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
    const credits = contributorData ? contributorData[1].toString() : "N/A";

    const renderContent = () => {
        if (!account) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Connettiti per iniziare.</p>;
        if (isStatusLoading) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica dello stato dell'account...</p>;
        return isActive ? <ActiveUserDashboard /> : <RegistrationForm />;
    };

    return (
        <div className="app-container">
            <aside className="sidebar">{/* ... sidebar ... */}</aside>
            <main className="main-content">
                <header className="header">
                    <ConnectButton client={client} chain={polygon} accountAbstraction={{ chain: polygon, sponsorGas: true }} wallets={[inAppWallet()]} />
                </header>
                <h2 className="page-title">Portale Aziende</h2>
                {renderContent()}
            </main>
        </div>
    );
}