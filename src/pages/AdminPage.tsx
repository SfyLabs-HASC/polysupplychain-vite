// FILE: src/pages/AdminPage.tsx
// QUESTA È LA VERSIONE FINALE CHE CORREGGE LA SINTASSI DELLE CHIAMATE ON-CHAIN

import React, { useState, useEffect, useCallback } from "react";
import { ConnectButton, TransactionButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, readContract, prepareContractCall } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { supplyChainABI as abi } from "../abi/contractABI";
import "../App.css";

// Definizione del tipo per un'azienda
type Company = {
  id: string;
  companyName: string;
  walletAddress: `0x${string}`;
  status: 'active' | 'pending' | 'deactivated';
  credits?: number;
  contactEmail?: string;
};

const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ 
  client, 
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});

// --- Componente Modale per la Modifica (con sintassi corretta) ---
const EditCompanyModal = ({ company, onClose, onUpdate }: { company: Company, onClose: () => void, onUpdate: () => void }) => {
  const [credits, setCredits] = useState(company.credits || 50);

  const updateOffChainStatus = async (action: string) => {
    // ... (logica invariata)
  };
  
  const handleDelete = async () => {
    // ... (logica invariata)
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Gestisci: {company.companyName}</h2>
        <p><strong>Wallet:</strong> {company.walletAddress}</p>
        <hr style={{margin: '1.5rem 0', borderColor: '#27272a'}}/>

        {/* 1. SEZIONE AZIONI STATO */}
        <div className="form-group">
          <label>Azioni Stato Contributor</label>
          <div className="modal-actions">
            {company.status === 'pending' && (
              <TransactionButton
                transaction={() => prepareContractCall({ 
                  contract, abi, 
                  // CORREZIONE: Sintassi completa della funzione
                  method: "function addContributor(address _contributorAddress, string memory _name)", 
                  params: [company.walletAddress, company.companyName] 
                })}
                onTransactionConfirmed={() => { /* ... */ }}
                onError={(error) => alert(`Errore: ${error.message}`)}
                className="web3-button"
              >
                ✅ Attiva Contributor
              </TransactionButton>
            )}
            {company.status === 'active' && (
              <TransactionButton
                transaction={() => prepareContractCall({ 
                  contract, abi, 
                  // CORREZIONE: Sintassi completa della funzione
                  method: "function deactivateContributor(address _contributorAddress)", 
                  params: [company.walletAddress] 
                })}
                onTransactionConfirmed={() => { /* ... */ }}
                onError={(error) => alert(`Errore: ${error.message}`)}
                className="web3-button" style={{backgroundColor: '#f59e0b'}}
              >
                ❌ Disattiva Contributor
              </TransactionButton>
            )}
            {company.status === 'deactivated' && (
              <TransactionButton
                transaction={() => prepareContractCall({ 
                  contract, abi, 
                  // CORREZIONE: Sintassi completa della funzione
                  method: "function addContributor(address _contributorAddress, string memory _name)", 
                  params: [company.walletAddress, company.companyName] 
                })}
                onTransactionConfirmed={() => { /* ... */ }}
                onError={(error) => alert(`Errore: ${error.message}`)}
                className="web3-button"
              >
                ✅ Riattiva Contributor
              </TransactionButton>
            )}
          </div>
        </div>

        {/* 2. SEZIONE GESTIONE CREDITI */}
        <div className="form-group" style={{marginTop: '1.5rem'}}>
          <label>Imposta Crediti</label>
          <input type="number" value={credits} onChange={(e) => setCredits(Number(e.target.value))} className="form-input" />
          <TransactionButton
            transaction={() => prepareContractCall({
              contract, abi,
              // CORREZIONE: Sintassi completa della funzione
              method: "function setContributorCredits(address _contributorAddress, uint256 _credits)",
              params: [company.walletAddress, BigInt(credits)]
            })}
            onTransactionConfirmed={() => { /* ... */ }}
            onError={(error) => alert(`Errore: ${error.message}`)}
            className="web3-button" style={{marginTop: '0.5rem', width: '100%'}}
            disabled={company.status === 'pending'}>
            Aggiorna Crediti
          </TransactionButton>
        </div>
        
        {/* ... (Il resto della modale rimane invariato) ... */}
        
        <button onClick={onClose} style={{marginTop: '2rem', background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer'}}>Chiudi</button>
      </div>
    </div>
  );
};


// --- Il resto del file (CompanyList e AdminPage) rimane invariato ---
const CompanyList = () => { /* ... Il codice di questo componente è corretto ... */ };
export default function AdminPage() { /* ... Il codice di questo componente è corretto ... */ };
