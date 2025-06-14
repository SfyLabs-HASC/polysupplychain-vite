// FILE: src/pages/AdminPage.tsx
// AGGIORNATO: Ora i pulsanti nella modale eseguono vere transazioni on-chain.

import React, { useState, useEffect, useCallback } from "react";
import { ConnectWallet, useAddress, useContract, useContractRead, useContractWrite, Web3Button } from "@thirdweb-dev/react";
import "../App.css";

type Company = {
  id: string;
  companyName: string;
  walletAddress: string;
  status: 'active' | 'pending' | 'deactivated';
  credits?: number;
};

const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302";

// --- Componente Modale per la Modifica ---
const EditCompanyModal = ({ company, onClose, onUpdate }: { company: Company, onClose: () => void, onUpdate: () => void }) => {
  const { contract } = useContract(contractAddress);
  const [credits, setCredits] = useState(company.credits || 50);
  const [isProcessing, setIsProcessing] = useState(false);

  // Hooks per le funzioni di scrittura del contratto
  const { mutateAsync: addContributor, isLoading: isActivating } = useContractWrite(contract, "addContributor");
  const { mutateAsync: setContributorCredits, isLoading: isSettingCredits } = useContractWrite(contract, "setContributorCredits");
  const { mutateAsync: deactivateContributor, isLoading: isDeactivating } = useContractWrite(contract, "deactivateContributor");

  // Funzione complessa per l'attivazione (2 transazioni + 1 chiamata API)
  const handleActivate = async () => {
    setIsProcessing(true);
    try {
      // 1. Esegui la prima transazione on-chain (addContributor)
      await addContributor({ args: [company.walletAddress, company.companyName] });
      
      // 2. Esegui la seconda transazione on-chain (setContributorCredits)
      await setContributorCredits({ args: [company.walletAddress, credits] });

      // 3. Se entrambe le tx hanno successo, aggiorna il nostro database off-chain
      await fetch('/api/activate-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', walletAddress: company.walletAddress, companyName: company.companyName, credits: credits }),
      });

      alert(`Azienda ${company.companyName} attivata con successo on-chain e nel database!`);
      onUpdate();
      onClose();

    } catch (error) {
      alert(`Errore durante l'attivazione: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isProcessing || isActivating || isSettingCredits || isDeactivating;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Gestisci: {company.companyName}</h2>
        <p><strong>Wallet:</strong> {company.walletAddress}</p>
        
        <div className="form-group">
            <label>Crediti</label>
            <input type="number" value={credits} onChange={(e) => setCredits(Number(e.target.value))} className="form-input" />
            
            <Web3Button
              contractAddress={contractAddress}
              action={() => setContributorCredits({ args: [company.walletAddress, credits] })}
              onSuccess={() => alert("Crediti aggiornati con successo!")}
              onError={(error) => alert(`Errore: ${error.message}`)}
              className="web3-button"
              style={{marginTop: '0.5rem'}}
              disabled={company.status === 'pending'}
            >
              Imposta Crediti
            </Web3Button>
        </div>
        
        <hr style={{margin: '1rem 0', borderColor: '#27272a'}}/>

        <div className="modal-actions">
            {company.status === 'pending' && <button onClick={handleActivate} disabled={isLoading} className="web3-button"> {isLoading ? "Attivazione..." : "✅ Attiva Contributor"} </button>}
            
            {company.status === 'active' && (
              <Web3Button
                contractAddress={contractAddress}
                action={() => deactivateContributor({ args: [company.walletAddress] })}
                onSuccess={() => alert("Azienda disattivata on-chain.")} // Qui andrebbe anche l'update del DB
                onError={(error) => alert(`Errore: ${error.message}`)}
                className="web3-button"
                style={{backgroundColor: '#f59e0b'}}
              >
                Disattiva Contributor
              </Web3Button>
            )}
            
            {/* Pulsante per eliminare l'azienda (azione solo off-chain) */}
        </div>

        <button onClick={onClose} disabled={isLoading} style={{marginTop: '2rem', background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer'}}>
            Chiudi
        </button>
      </div>
    </div>
  );
};


// --- Il resto del file (CompanyList e AdminPage) rimane quasi identico ---
// ... Incolla qui il resto del codice dei componenti CompanyList e AdminPage ...
const CompanyList = () => { /* ... Stessa logica di prima ... */ };
export default function AdminPage() { /* ... Stessa logica di prima ... */ };

