// ===============================================
// FILE: src/pages/AdminPage.tsx
// ===============================================

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { KitConnectButton } from '@0xsequence/kit';
import { abi } from '../abi/SupplyChainV2.json';
import "../App.css";

type Company = {
  id: string; companyName: string; walletAddress: string;
  status: 'active' | 'pending' | 'deactivated';
  credits?: number; contactEmail?: string; relayerWalletAddress?: string;
};

const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302" as const;

// --- Componente Modale per la Modifica ---
const EditCompanyModal = ({ company, onClose, onUpdate }: { company: Company, onClose: () => void, onUpdate: () => void }) => {
  const [credits, setCredits] = useState(company.credits || 50);
  const { writeContractAsync, isPending } = useWriteContract();

  const updateOffChainStatus = async (action: string) => {
    try {
      await fetch('/api/activate-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, walletAddress: company.walletAddress, credits: parseInt(String(credits)), companyName: company.companyName }),
      });
      onUpdate();
    } catch (error) { alert(`Errore DB: ${(error as Error).message}`); }
  };

  const handleActivate = async () => {
    try {
      await writeContractAsync({ abi, address: contractAddress, functionName: 'addContributor', args: [company.walletAddress, company.companyName] });
      await writeContractAsync({ abi, address: contractAddress, functionName: 'setContributorCredits', args: [company.walletAddress, credits] });
      alert("Azienda attivata on-chain!");
      await updateOffChainStatus('activate');
      onClose();
    } catch (error) { alert(`Errore on-chain: ${(error as Error).message}`); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Gestisci: {company.companyName}</h2>
        <button onClick={handleActivate} disabled={isPending} className="web3-button">
          {isPending ? "Attivazione..." : "✅ Attiva Contributor"}
        </button>
        {/* ... Altri pulsanti di gestione qui ... */}
        <button onClick={onClose} disabled={isPending} style={{marginTop: '2rem'}}>Chiudi</button>
      </div>
    </div>
  );
};

// --- Componente per la Lista delle Aziende ---
const CompanyList = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/get-pending-companies');
      const data = await response.json();
      if (response.ok) {
        setCompanies([...(data.pending || []), ...(data.active || [])]);
      } else {
        throw new Error(data.error || "Errore sconosciuto");
      }
    } catch (error) {
      console.error("Errore caricamento aziende:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return (
    <div style={{ marginTop: '2rem' }}>
      <table className="company-table">
        <thead>
          <tr>
            <th>Stato</th>
            <th>Nome Azienda</th>
            <th>Wallet Address</th>
            <th>Azione</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={4} style={{textAlign: 'center'}}>Caricamento...</td></tr>
          ) : (
            companies.map(c => (
              <tr key={c.id}>
                <td>{c.status === 'active' ? '✅' : '⏳'}</td>
                <td>{c.companyName}</td>
                <td>{c.walletAddress}</td>
                <td><button onClick={() => setSelectedCompany(c)} className="web3-button">Gestisci</button></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {selectedCompany && <EditCompanyModal company={selectedCompany} onClose={() => setSelectedCompany(null)} onUpdate={fetchCompanies} />}
    </div>
  );
};

// --- Componente Principale della Pagina Admin ---
export default function AdminPage() {
  const { address, isConnected } = useAccount();

  const { data: superOwner } = useReadContract({ address: contractAddress, abi: abi, functionName: 'superOwner' });
  const { data: owner } = useReadContract({ address: contractAddress, abi: abi, functionName: 'owner' });

  const isAllowed = isConnected && address && (
    (superOwner && address.toLowerCase() === (superOwner as string).toLowerCase()) ||
    (owner && address.toLowerCase() === (owner as string).toLowerCase())
  );
  
  return (
    <div className="app-container">
      <main className="main-content" style={{width: '100%'}}>
        <header className="header"><KitConnectButton /></header>
        <h1 className="page-title">Pannello Amministrazione</h1>
        {!isConnected ? <p>Connetti il tuo wallet...</p> : 
         isAllowed ? <div><h3>Benvenuto, SFY Labs!</h3><CompanyList /></div> : 
         <h2 style={{ color: '#ef4444' }}>❌ ACCESSO NEGATO</h2>}
      </main>
    </div>
  );
}
