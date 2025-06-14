// FILE: src/pages/AdminPage.tsx
// QUESTA È LA VERSIONE FINALE CHE RISOLVE L'ERRORE DELLA CHIAMATA API

import React, { useState, useEffect, useCallback } from "react";
import { ConnectWallet, useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
import "../App.css";

// Definizione del tipo per un'azienda per una migliore gestione in TypeScript
type Company = {
  id: string;
  companyName: string;
  contactEmail: string;
  walletAddress: string;
  status: 'active' | 'pending' | 'deactivated';
  credits?: number;
};

// Indirizzo del contratto
const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302";

// --- Componente Modale per la Modifica ---
const EditCompanyModal = ({ company, onClose, onUpdate }: { company: Company, onClose: () => void, onUpdate: () => void }) => {
  const [credits, setCredits] = useState(company.credits || 50);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/activate-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, walletAddress: company.walletAddress, companyName: company.companyName, credits: parseInt(String(credits)) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Azione fallita");
      alert(result.message);
      onUpdate();
      onClose();
    } catch (error) {
      alert(`Errore: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDelete = async () => {
     if (!window.confirm(`Sei sicuro di voler eliminare ${company.companyName}? L'azione è irreversibile.`)) return;
     setIsProcessing(true);
     try {
       const response = await fetch('/api/delete-company', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ walletAddress: company.walletAddress, status: company.status }),
       });
       const result = await response.json();
       if (!response.ok) throw new Error(result.error);
       alert(result.message);
       onUpdate();
       onClose();
     } catch (error) {
        alert(`Errore: ${(error as Error).message}`);
     } finally {
        setIsProcessing(false);
     }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Gestisci: {company.companyName}</h2>
        <p><strong>Wallet:</strong> {company.walletAddress}</p>
        <div className="form-group">
            <label>Crediti</label>
            <input type="number" value={credits} onChange={(e) => setCredits(Number(e.target.value))} className="form-input" />
            <button onClick={() => handleAction('setCredits')} disabled={isProcessing || company.status === 'pending'} className="web3-button" style={{marginTop: '0.5rem'}}>Imposta Crediti</button>
        </div>
        <hr style={{margin: '1rem 0', borderColor: '#27272a'}}/>
        <div className="modal-actions">
            {company.status === 'pending' && <button onClick={() => handleAction('activate')} disabled={isProcessing} className="web3-button">✅ Attiva Contributor</button>}
            {company.status === 'active' && <button onClick={() => handleAction('deactivate')} disabled={isProcessing} className="web3-button" style={{backgroundColor: '#f59e0b'}}>⏳ Disattiva Contributor</button>}
            {company.status === 'deactivated' && <button onClick={() => handleAction('activate')} disabled={isProcessing} className="web3-button">✅ Riattiva Contributor</button>}
            {(company.status === 'pending' || company.status === 'deactivated') && <button onClick={handleDelete} disabled={isProcessing} className="web3-button" style={{backgroundColor: '#ef4444'}}>❌ Elimina Azienda</button>}
        </div>
        <button onClick={onClose} disabled={isProcessing} style={{marginTop: '2rem', background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer'}}>Chiudi</button>
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
        setIsLoading(true);
        try {
            // CORREZIONE CHIAVE: Abbiamo messo il nome del file corretto!
            const response = await fetch('/api/get-pending-companies');
            const data = await response.json();
            if (!response.ok) { throw new Error(data.error); }
            
            const pending = data.pending.map((p: any) => ({ ...p, status: 'pending' }));
            const active = data.active.map((a: any) => ({ ...a, status: a.status || 'active' }));
            setAllCompanies([...pending, ...active]);

        } catch (error) { console.error("Errore caricamento aziende:", error); }
        setIsLoading(false);
    }, []);

    useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

    useEffect(() => {
        let companies = [...allCompanies];
        if (filterStatus !== "all") { companies = companies.filter(c => c.status === filterStatus); }
        if (searchTerm) { companies = companies.filter(c => c.companyName.toLowerCase().includes(searchTerm.toLowerCase())); }
        setFilteredCompanies(companies);
    }, [searchTerm, filterStatus, allCompanies]);

    return (
        <div style={{ marginTop: '2rem' }}>
            <div className="filters-container">
              <input type="text" placeholder="Cerca..." className="form-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '300px' }}/>
              <select className="form-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '200px' }}>
                <option value="all">Tutti</option><option value="active">Attivate</option><option value="pending">In Pending</option><option value="deactivated">Disattivate</option>
              </select>
            </div>
            <table className="company-table">
                <thead><tr><th>Stato</th><th>Nome Azienda</th><th>Wallet Address</th><th>Azione</th></tr></thead>
                <tbody>
                    {isLoading ? (<tr><td colSpan={4} style={{textAlign: 'center', padding: '2rem'}}>Caricamento...</td></tr>) : 
                    filteredCompanies.length > 0 ? (
                        filteredCompanies.map(c => (
                        <tr key={c.id}>
                            <td>{c.status === 'active' ? '✅' : c.status === 'pending' ? '⏳' : '❌'}</td>
                            <td>{c.companyName}</td><td>{c.walletAddress}</td>
                            <td><button onClick={() => setSelectedCompany(c)} className="web3-button" style={{padding: '0.5rem 1rem'}}>Gestisci</button></td>
                        </tr>
                        ))) : 
                    (<tr><td colSpan={4} style={{textAlign: 'center', padding: '2rem'}}>Nessuna azienda trovata.</td></tr>)}
                </tbody>
            </table>
            {selectedCompany && <EditCompanyModal company={selectedCompany} onClose={() => setSelectedCompany(null)} onUpdate={fetchCompanies} />}
        </div>
    );
};


// --- Componente Principale della Pagina Admin ---
export default function AdminPage() {
    const address = useAddress();
    const { contract } = useContract(contractAddress);
    const { data: superOwner } = useContractRead(contract, "superOwner");
    const { data: owner } = useContractRead(contract, "owner");
    const isAllowed = address && ( (superOwner && address.toLowerCase() === superOwner.toLowerCase()) || (owner && address.toLowerCase() === owner.toLowerCase()) );

    return (
        <div className="app-container">
            <main className="main-content" style={{width: '100%'}}>
                <header className="header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 className="page-title">Pannello Amministrazione</h1>
                    <ConnectWallet theme="dark" btnTitle="Connetti"/>
                </header>
                {!address ? <p>Connetti il tuo wallet...</p> : 
                isAllowed ? <div><h3>Benvenuto, SFY Labs!</h3><CompanyList /></div> : 
                <h2 style={{ color: '#ef4444', fontSize: '2rem', marginTop: '4rem' }}>❌ ACCESSO NEGATO</h2>}
            </main>
        </div>
    );
}
