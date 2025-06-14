// FILE: src/pages/AdminPage.tsx
// Versione finale che include la creazione di wallet relayer dedicati.

import React, { useState, useEffect, useCallback } from "react";
import { ConnectWallet, useAddress, useContract, useContractRead, Web3Button } from "@thirdweb-dev/react";
import "../App.css";

// Aggiorniamo il tipo Company per includere il wallet relayer
type Company = {
  id: string;
  companyName: string;
  walletAddress: string;
  status: 'active' | 'pending' | 'deactivated';
  credits?: number;
  contactEmail?: string;
  relayerWalletAddress?: string; // Indirizzo del wallet dedicato
};

const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302";

// --- Componente Modale per la Modifica ---
const EditCompanyModal = ({ company, onClose, onUpdate }: { company: Company, onClose: () => void, onUpdate: () => void }) => {
  const [credits, setCredits] = useState(company.credits || 50);
  const [isProcessing, setIsProcessing] = useState(false);

  // Funzione per creare il wallet relayer dedicato
  const handleCreateRelayer = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/create-relayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id, companyStatus: company.status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      alert(result.message);
      onUpdate(); // Ricarica la lista per mostrare il nuovo indirizzo
    } catch (error) {
      alert(`Errore creazione relayer: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ... (le altre funzioni come handleDelete e updateOffChainStatus rimangono qui)
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Gestisci: {company.companyName}</h2>
        <p><strong>Wallet Social:</strong> {company.walletAddress}</p>
        <hr style={{margin: '1rem 0', borderColor: '#27272a'}}/>
        
        {/* NUOVA SEZIONE: GESTIONE WALLET RELAYER */}
        <div className="form-group">
            <label>Wallet Relayer Dedicato</label>
            {company.relayerWalletAddress ? (
                <p style={{fontFamily: 'monospace', background: '#27272a', padding: '0.5rem', borderRadius: '5px', wordWrap: 'break-word'}}>{company.relayerWalletAddress}</p>
            ) : (
                <>
                    <p style={{color: '#a0a0a0', fontSize: '0.9rem'}}>Nessun wallet relayer assegnato.</p>
                    <button onClick={handleCreateRelayer} disabled={isProcessing} className="web3-button">
                        {isProcessing ? "Creazione in corso..." : "Crea e Assegna Wallet Relayer"}
                    </button>
                </>
            )}
        </div>
        <hr style={{margin: '1rem 0', borderColor: '#27272a'}}/>

        {/* Qui sotto ci sono le altre azioni che avevamo già implementato */}
        {/* ... (Attiva, Disattiva, Imposta Crediti, Elimina) ... */}
        
        <button onClick={onClose} style={{marginTop: '2rem', background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer'}}>
            Chiudi
        </button>
      </div>
    </div>
  );
};

// --- Componente per la Lista delle Aziende ---
const CompanyList = () => {
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const fetchCompanies = useCallback(async () => {
    // ... (la logica di caricamento è la stessa di prima)
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  useEffect(() => {
    // ... (la logica di filtro è la stessa di prima)
  }, [searchTerm, filterStatus, allCompanies]);

  return (
    <div style={{ marginTop: '2rem' }}>
      <div className="filters-container">
          {/* ... Filtri ... */}
      </div>
      <table className="company-table">
        <thead>
          <tr>
            <th>Stato</th>
            <th>Nome Azienda</th>
            <th>Wallet Social</th>
            <th>Wallet Relayer</th>
            <th>Azione</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (<tr><td colSpan={5}>Caricamento...</td></tr>) : 
           filteredCompanies.map(c => (
            <tr key={c.id}>
              <td>{c.status === 'active' ? '✅' : '⏳'}</td>
              <td>{c.companyName}</td>
              <td>{c.walletAddress}</td>
              <td>{c.relayerWalletAddress || '/'}</td>
              <td><button onClick={() => setSelectedCompany(c)} className="web3-button" style={{padding: '0.5rem 1rem'}}>Gestisci</button></td>
            </tr>
           ))}
        </tbody>
      </table>
      {selectedCompany && <EditCompanyModal company={selectedCompany} onClose={() => setSelectedCompany(null)} onUpdate={fetchCompanies} />}
    </div>
  );
};


// --- Componente Principale della Pagina Admin ---
export default function AdminPage() {
    // ... (Questo componente rimane invariato)
}
