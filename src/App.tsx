// FILE: src/pages/AziendaPage.tsx (Modificato per usare un RPC pubblico di Moonbeam)

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
// MODIFICA: Importiamo 'defineChain' per creare una definizione di chain custom
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall, readContract } from 'thirdweb';
// MODIFICA: Importiamo 'defineChain'
import { defineChain } from 'thirdweb/chains'; 
import { inAppWallet } from 'thirdweb/wallets';
import { supplyChainABI as abi } from '../abi/contractABI';
import '../App.css'; 

import TransactionStatusModal from '../components/TransactionStatusModal';

// --- Stili CSS (invariati) ---
const AziendaPageStyles = () => (
  <style>{`
    /* ... il tuo CSS rimane qui, non l'ho toccato ... */
    /* Stili globali per la pagina */
    .app-container-full { padding: 0 2rem; }
    .main-header-bar { display: flex; justify-content: space-between; align-items: center; }
    .header-title { font-size: 1.75rem; font-weight: bold; }
    
    /* Header del Dashboard */
    .dashboard-header-card { display: flex; justify-content: space-between; align-items: center; position: relative; padding: 1.5rem; background-color: #212529; border: 1px solid #495057; border-radius: 8px; margin-bottom: 2rem; }
    .dashboard-header-info { display: flex; flex-direction: column; }
    .company-name-header { margin-top: 0; margin-bottom: 1rem; font-size: 3rem; }
    .company-status-container { display: flex; align-items: center; gap: 1.5rem; }
    .status-item { display: flex; align-items: center; gap: 0.5rem; }
    .header-actions .web3-button.large { padding: 1rem 2rem; font-size: 1.1rem; }

    /* Tabella e righe per Desktop */
    .company-table .desktop-row { display: table-row; }
    .company-table .mobile-card { display: none; }
    .pagination-controls { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; }

    /* Stili per il riepilogo nel modal */
    .recap-summary { text-align: left; padding: 15px; background-color: #2a2a2a; border: 1px solid #444; border-radius: 8px; margin-bottom: 20px;}
    .recap-summary p { margin: 8px 0; word-break: break-word; }
    .recap-summary p strong { color: #f8f9fa; }
    @media (max-width: 768px) {
        .app-container-full { padding: 0 1rem; }
        .main-header-bar { flex-direction: column; align-items: flex-start; gap: 1rem; }
        .header-title { font-size: 1.5rem; }
        .wallet-button-container { align-self: flex-start; }
        .dashboard-header-card { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
        .company-name-header { font-size: 2.2rem; }
        .company-status-container { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
        .header-actions { width: 100%; }
        .header-actions .web3-button.large { width: 100%; font-size: 1rem; }
        
        .company-table thead { display: none; }
        .company-table .desktop-row { display: none; }
        .company-table tbody, .company-table tr, .company-table td { display: block; width: 100%; }
        .company-table tr { margin-bottom: 1rem; }
        .company-table td[colspan="7"] { padding: 20px; text-align: center; border: 1px solid #495057; border-radius: 8px; }
        
        .mobile-card { display: block; border: 1px solid #495057; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background-color: #2c3e50; }
        .mobile-card .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid #495057; padding-bottom: 0.75rem; }
        .mobile-card .card-header strong { font-size: 1.1rem; }
        .mobile-card .card-body p { margin: 0.5rem 0; }
        .mobile-card .card-body p strong { color: #bdc3c7; }
        .mobile-card .card-footer { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #495057; }
        .mobile-card .web3-button { width: 100%; text-align: center; }
        .pagination-controls { flex-direction: column; gap: 1rem; }
    }
  `}</style>
);

// --- INIZIO MODIFICHE ---

const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });

// 1. Definiamo la rete Moonbeam con il suo RPC pubblico
const moonbeamPublicRpc = defineChain({
  id: 1284, // ID della rete Moonbeam
  rpc: "https://moonbeam.public.blastapi.io", // RPC Pubblico trovato
});

// 2. Usiamo la nuova definizione di chain per ottenere il contratto
const contract = getContract({ 
  client, 
  chain: moonbeamPublicRpc, // <-- Usiamo la chain custom
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302" // ATTENZIONE: l'indirizzo del contratto deve essere valido su Moonbeam
});

// --- FINE MODIFICHE ---


// --- Il resto del codice (invariato) ---
const RegistrationForm = () => ( <div className="card"><h3>Benvenuto su Easy Chain!</h3><p>Il tuo account non è ancora attivo. Compila il form di registrazione per inviare una richiesta di attivazione.</p></div> );
const BatchRow = ({ batch, localId }: { batch: BatchData; localId: number }) => {
    const [showDescription, setShowDescription] = useState(false);
    const { data: stepCount } = useReadContract({ contract, abi, method: "function getBatchStepCount(uint256 _batchId) view returns (uint256)", params: [batch.batchId] });
    const formatDate = (dateStr: string | undefined) => !dateStr || dateStr.split('-').length !== 3 ? '/' : dateStr.split('-').reverse().join('/');
    return (
        <>
            <tr className="desktop-row">
                <td>{localId}</td>
                <td><span className="clickable-name" onClick={() => setShowDescription(true)}>{batch.name || '/'}</span></td>
                <td>{formatDate(batch.date)}</td>
                <td>{batch.location || '/'}</td>
                <td>{stepCount !== undefined ? stepCount.toString() : '/'}</td>
                <td>{batch.isClosed ? <span className="status-closed">✅ Chiuso</span> : <span className="status-open">⏳ Aperto</span>}</td>
                <td><Link to={`/gestisci/${batch.batchId}`} className="web3-button">Gestisci</Link></td>
            </tr>
            <tr className="mobile-card">
                <td>
                    <div className="card-header"><strong className="clickable-name" onClick={() => setShowDescription(true)}>{batch.name || 'N/A'}</strong><span className={`status ${batch.isClosed ? 'status-closed' : 'status-open'}`}>{batch.isClosed ? '✅ Chiuso' : '⏳ Aperto'}</span></div>
                    <div className="card-body"><p><strong>ID:</strong> {localId}</p><p><strong>Data:</strong> {formatDate(batch.date)}</p><p><strong>Luogo:</strong> {batch.location || '/'}</p><p><strong>N° Passaggi:</strong> {stepCount !== undefined ? stepCount.toString() : '/'}</p></div>
                    <div className="card-footer"><Link to={`/gestisci/${batch.batchId}`} className="web3-button">Gestisci</Link></div>
                </td>
            </tr>
            {showDescription && (
                <div className="modal-overlay" onClick={() => setShowDescription(false)}>
                    <div className="modal-content description-modal" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h2>Descrizione Iscrizione / Lotto</h2></div><div className="modal-body"><p>{batch.description || 'Nessuna descrizione fornita.'}</p></div><div className="modal-footer"><button onClick={() => setShow