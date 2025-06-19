// FILE: src/pages/AziendaPage.tsx
// (CODICE CON RIMOZIONE "CIAO" E CONFERMA FINALE)

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall, readContract } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { inAppWallet } from 'thirdweb/wallets';
import { supplyChainABI as abi } from '../abi/contractABI';
import '../App.css'; 

import TransactionStatusModal from '../components/TransactionStatusModal';

// ... (Client e Contract rimangono invariati)
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ client, chain: polygon, address: "0x4a866C3A071816E3186e18cbE99a3339f4571302" });

// ... (RegistrationForm, BatchRow, BatchTable rimangono invariati)
const RegistrationForm = () => ( <div className="card"><h3>Benvenuto su Easy Chain!</h3><p>Il tuo account non è ancora attivo. Compila il form di registrazione per inviare una richiesta di attivazione.</p></div> );
interface BatchData { id: string; batchId: bigint; name: string; description: string; date: string; location: string; isClosed: boolean; }
const BatchRow = ({ batch, localId }: { batch: BatchData; localId: number }) => { /* ... */ return(<tr></tr>);};
const BatchTable = ({ batches, nameFilter, setNameFilter, locationFilter, setLocationFilter, statusFilter, setStatusFilter }: any) => { /* ... */ return(<div></div>);};


// MODIFICA QUI
const DashboardHeader = ({ contributorInfo, onNewInscriptionClick }: { contributorInfo: readonly [string, bigint, boolean], onNewInscriptionClick: () => void }) => {
    const companyName = contributorInfo[0] || 'Azienda';
    const credits = contributorInfo[1].toString();
    return (
        <div className="dashboard-header-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            <div>
                {/* MODIFICA: Rimosso "Ciao," dal titolo */}
                <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '3rem' }}>{companyName}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div className="status-item"><span>Crediti Rimanenti: <strong>{credits}</strong></span></div>
                    <div className="status-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>Stato: <strong>ATTIVO</strong></span><span className="status-icon">✅</span></div>
                </div>
            </div>
            <div className="header-actions"><button className="web3-button large" onClick={onNewInscriptionClick}>Nuova Iscrizione</button></div>
        </div>
    );
};

export default function AziendaPage() {
    const account = useActiveAccount();
    const { data: contributorData, isLoading: isStatusLoading, refetch: refetchContributorInfo } = useReadContract({ contract, method: "function getContributorInfo(address) view returns (string, uint256, bool)", params: account ? [account.address] : undefined, queryOptions: { enabled: !!account } });
    
    // ... (Tutti gli altri state e hooks rimangono invariati)
    const [modal, setModal] = useState<'init' | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "", date: new Date().toISOString().split('T')[0], location: "" });

    // MODIFICA QUI
    const handleInitializeBatch = async () => {
        // MODIFICA: Aggiunto il popup di conferma finale
        if (!window.confirm("Vuoi confermare tutti i dati inseriti e procedere con l'iscrizione?")) {
            return; // Se l'utente clicca "Annulla", la funzione si ferma qui
        }

        setModal(null);

        if (!formData.name.trim()) {
            setTxResult({ status: 'error', message: 'Il campo Nome è obbligatorio.' });
            return;
        }

        // ... (il resto della logica di upload e transazione rimane invariato)
        let imageIpfsHash = "N/A";
        // ... Logica di upload
        // ... Logica sendTransaction
    };
    
    // ... (Tutto il resto del componente rimane invariato)
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [txResult, setTxResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
    // ... etc ...
    
    return (
        <div className="app-container-full" style={{ padding: '0 2rem' }}>
            {/* ... JSX del return ... */}
        </div>
    );
}