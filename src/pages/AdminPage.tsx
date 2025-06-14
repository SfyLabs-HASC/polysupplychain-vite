// FILE: src/pages/AdminPage.tsx
// QUESTA È LA VERSIONE FINALE E COMPLETA CON LA MODALE DI GESTIONE CORRETTA

import React, { useState, useEffect, useCallback } from "react";
import { ConnectWallet, useAddress, useContract, useContractRead, Web3Button } from "@thirdweb-dev/react";
import "../App.css";

// Definizione del tipo per un'azienda per una migliore gestione in TypeScript
type Company = {
  id: string;
  companyName: string;
  walletAddress: string;
  status: 'active' | 'pending' | 'deactivated';
  credits?: number;
  contactEmail?: string;
};

const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302";

// --- Componente Modale per la Modifica ---
const EditCompanyModal = ({ company, onClose, onUpdate }: { company: Company, onClose: () => void, onUpdate: () => void }) => {
  const { contract } = useContract(contractAddress);
  const [credits, setCredits] = useState(company.credits || 50);

  // Funzione generica per aggiornare il nostro DB dopo un'azione on-chain
  const updateOffChainStatus = async (action: string) => {
    try {
      await fetch('/api/activate-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, walletAddress: company.walletAddress, credits: parseInt(String(credits)), companyName: company.companyName }),
      });
      onUpdate(); // Ricarica la lista per mostrare i cambiamenti
    } catch (error) {
      alert(`Errore nell'aggiornare il database: ${(error as Error).message}`);
    }
  };
  
  // Funzione per eliminare (solo off-chain)
  const handleDelete = async () => {
    if (!window.confirm(`Sei sicuro di voler eliminare definitivamente ${company.companyName}?`)) return;
    try {
      await fetch('/api/delete-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: company.walletAddress, status: company.status }),
      });
      alert("Azienda eliminata dalla lista.");
      onUpdate();
      onClose();
    } catch (error) {
       alert(`Errore: ${(error as Error).message}`);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Gestisci: {company.companyName}</h2>
        <p><strong>Wallet:</strong> {company.walletAddress}</p>
        <hr style={{margin: '1rem 0', borderColor: '#27272a'}}/>
        
        {/* SEZIONE AZIONI */}
        <div className="modal-actions">
          {/* Attivazione */}
          {company.status === 'pending' && (
            <Web3Button
              contractAddress={contractAddress}
              action={async (c) => {
                await c.call("addContributor", [company.walletAddress, company.companyName]);
                await c.call("setContributorCredits", [company.walletAddress, credits]);
              }}
              onSuccess={() => { alert("Azienda attivata on-chain!"); updateOffChainStatus('activate'); }}
              onError={(err) => alert(`Errore: ${err.message}`)}
              className="web3-button"
            >
              ✅ Attiva Contributor
            </Web3Button>
          )}

          {/* Disattivazione */}
          {company.status === 'active' && (
            <Web3Button
              contractAddress={contractAddress}
              action={(c) => c.call("deactivateContributor", [company.walletAddress])}
              onSuccess={() => { alert("Azienda disattivata on-chain!"); updateOffChainStatus('deactivate'); }}
              onError={(err) => alert(`Errore: ${err.message}`)}
              className="web3-button" style={{backgroundColor: '#f59e0b'}}
            >
              Disattiva Contributor
            </Web3Button>
          )}

          {/* Riattivazione */}
          {company.status === 'deactivated' && (
             <Web3Button
              contractAddress={contractAddress}
              action={(c) => c.call("addContributor", [company.walletAddress, company.companyName])}
              onSuccess={() => { alert("Azienda riattivata on-chain!"); updateOffChainStatus('reactivate'); }}
              onError={(err) => alert(`Errore: ${err.message}`)}
              className="web3-button"
            >
              ✅ Riattiva Contributor
            </Web3Button>
          )}
        </div>

        {/* SEZIONE CREDITI */}
        <div className="form-group" style={{marginTop: '1.5rem'}}>
            <label>Imposta Crediti</label>
            <input type="number" value={credits} onChange={(e) => setCredits(Number(e.target.value))} className="form-input" />
            <Web3Button
              contractAddress={contractAddress}
              action={(c) => c.call("setContributorCredits", [company.walletAddress, credits])}
              onSuccess={() => { alert("Crediti impostati on-chain!"); updateOffChainStatus('setCredits'); }}
              onError={(err) => alert(`Errore: ${err.message}`)}
              className="web3-button" style={{marginTop: '0.5rem', width: '100%'}}
              isDisabled={company.status === 'pending'}>
              Aggiorna Crediti
            </Web3Button>
        </div>

        {/* SEZIONE ELIMINAZIONE */}
        {(company.status === 'pending' || company.status === 'deactivated') && (
            <div style={{marginTop: '1.5rem', borderTop: '1px solid #27272a', paddingTop: '1.5rem'}}>
                <button onClick={handleDelete} className="web3-button" style={{backgroundColor: '#ef4444', width: '100%'}}>
                    ❌ Elimina da Lista
                </button>
            </div>
        )}

        <button onClick={onClose} style={{marginTop: '2rem', background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer'}}>Chiudi</button>
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
            const response = await fetch('/api/get-pending-companies');
            const data = await response.json();
            if (!response.ok) { throw new Error(data.error || "Errore sconosciuto"); }
            const pending = (data.pending || []).map((p: any) => ({ ...p, status: 'pending' }));
            const active = (data.active || []).map((a: any) => ({ ...a, status: a.status || 'active' }));
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
                <thead><tr><th>Stato</th><th>Nome Azienda</th><th>Wallet Address</th><th>Email</th><th>Azione</th></tr></thead>
                <tbody>
                    {isLoading ? (<tr><td colSpan={5} style={{textAlign: 'center', padding: '2rem'}}>Caricamento...</td></tr>) : 
                    filteredCompanies.length > 0 ? (
                        filteredCompanies.map(c => (
                        <tr key={c.id}>
                            <td>{c.status === 'active' ? '✅' : c.status === 'pending' ? '⏳' : '❌'}</td>
                            <td>{c.companyName}</td>
                            <td>{c.walletAddress}</td>
                            <td>{c.contactEmail || "/"}</td>
                            <td><button onClick={() => setSelectedCompany(c)} className="web3-button" style={{padding: '0.5rem 1rem'}}>Gestisci</button></td>
                        </tr>
                        ))) : 
                    (<tr><td colSpan={5} style={{textAlign: 'center', padding: '2rem'}}>Nessuna azienda trovata.</td></tr>)}
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
