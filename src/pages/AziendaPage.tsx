// FILE: src/pages/AziendaPage.tsx
// VERSIONE FINALE CON MIGLIORAMENTI UI/UX E NUOVA HEADER CARD

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

const RegistrationForm = () => { /* ... codice invariato ... */ return <div>Form di Registrazione</div>; };

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
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Descrizione Iscrizione / Lotto</h2>
                        <p style={{whiteSpace: 'pre-wrap', maxHeight: '60vh', overflowY: 'auto'}}>{description || 'Nessuna descrizione fornita.'}</p>
                        <button onClick={() => setShowDescription(false)} className="web3-button" style={{marginTop: '1rem', width: '100%'}}>Chiudi</button>
                    </div>
                </div>
            )}
        </>
    );
};

const BatchTable = () => { /* ... codice invariato ... */ };

const ActiveUserDashboard = ({ contributorInfo }: { contributorInfo: readonly [string, bigint, boolean] }) => {
    const account = useActiveAccount();
    const { disconnect } = useDisconnect();
    
    // Azioni Rapide e Modali
    const [modal, setModal] = useState<'init' | 'add' | 'close' | null>(null);
    const [formData, setFormData] = useState({ batchName: "", batchDescription: "", stepName: "", stepDescription: "", stepLocation: "" });
    const [manualBatchId, setManualBatchId] = useState('');
    const { mutate: sendTransaction, isPending } = useSendTransaction();
    
    // Funzioni per le transazioni (invariate)
    const handleInitializeBatch = () => { /* ... */ };
    const handleAddStep = () => { /* ... */ };
    const handleCloseBatch = () => { /* ... */ };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
    const handleTransactionSuccess = (receipt: any) => { /* ... */ };


    const companyName = contributorInfo[0];
    const credits = contributorInfo[1].toString();
    const isActive = contributorInfo[2];

    const handleLogout = () => {
        if(account) {
            disconnect(account.wallet);
        }
        window.location.href = '/'; // Reindirizza alla Home Page
    };

    return (
        <div className="card">
            {/* NUOVA INFO CARD */}
            <div className='user-info-card'>
                <div className='info-details'>
                    <h3>Benvenuto, {companyName || 'Azienda'}</h3>
                    <div className='info-row'>
                        <span><strong>Stato:</strong> <span className={isActive ? 'status-active' : 'status-inactive'}>{isActive ? 'ATTIVO' : 'DISATTIVO'}</span></span>
                        <span><strong>Crediti Rimanenti:</strong> {credits}</span>
                    </div>
                    <div className='info-row'>
                        <span><strong>Wallet Connesso:</strong> {account?.address}</span>
                    </div>
                </div>
                <button onClick={handleLogout} className='logout-button'>Logout</button>
            </div>
            
            {/* AZIONI RAPIDE */}
            <div className='actions-section'>
                <h4>Azioni Rapide</h4>
                {/* ... JSX delle azioni rapide (Inizializza, Aggiungi Step, etc) ... */}
            </div>
            
            <hr style={{margin: '2rem 0', borderColor: '#27272a'}} />

            {/* TABELLA LOTTI */}
            <BatchTable />

            {/* MODALI (invariati) */}
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

    const renderContent = () => {
        if (!account) {
            // Se non c'è un account, mostra il pulsante per connettere
            return (
                <div className='connect-container'>
                    <h2>Connettiti per accedere al portale</h2>
                    <ConnectButton client={client} chain={polygon} accountAbstraction={{ chain: polygon, sponsorGas: true }} wallets={[inAppWallet()]} />
                </div>
            );
        }
        
        if (isStatusLoading) {
            return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica stato account...</p>;
        }

        const isActive = contributorData ? contributorData[2] : false;

        if (!isActive) {
             return <RegistrationForm />;
        }
        
        // Se l'utente è attivo, mostra la dashboard completa passando le info
        return <ActiveUserDashboard contributorInfo={contributorData!} />;
    };

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-header"><h1 className="sidebar-title">Easy Chain</h1></div>
                {/* La sidebar ora può essere più minimale, dato che le info sono nella card */}
            </aside>
            <main className="main-content">
                <header className="header">
                    <h2 className="page-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '0.5rem', verticalAlign: 'middle'}}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>
                        Portale Aziende - Le mie Iscrizioni
                    </h2>
                </header>
                {renderContent()}
            </main>
        </div>
    );
}
