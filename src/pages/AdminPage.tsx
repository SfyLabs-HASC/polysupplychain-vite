// FILE: src/pages/AdminPage.tsx
// QUESTA È LA VERSIONE FINALE CHE INCLUDE TUTTE LE FUNZIONALITÀ E CORREGGE GLI ERRORI

import React, { useState, useEffect, useCallback } from "react";
import { ConnectButton, TransactionButton, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, readContract, prepareContractCall } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { supplyChainABI as abi } from "../abi/contractABI";
import "../App.css";

// Definizione del tipo per un'azienda per una migliore gestione
type Company = {
  id: string;
  companyName: string;
  walletAddress: `0x${string}`;
  status: 'active' | 'pending' | 'deactivated';
  credits?: number;
  contactEmail?: string;
};

// Configurazione del Client e del Contratto
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ 
  client, 
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});


// --- Componente Modale per la Modifica (Completo e Corretto) ---
const EditCompanyModal = ({ company, onClose, onUpdate }: { company: Company, onClose: () => void, onUpdate: () => void }) => {
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
                transaction={() => prepareContractCall({ contract, abi, method: "addContributor", params: [company.walletAddress, company.companyName] })}
                onTransactionConfirmed={() => {
                  alert("Azienda attivata on-chain!");
                  updateOffChainStatus('activate');
                  onClose();
                }}
                onError={(error) => alert(`Errore: ${error.message}`)}
                className="web3-button"
              >
                ✅ Attiva Contributor
              </TransactionButton>
            )}
            {company.status === 'active' && (
              <TransactionButton
                transaction={() => prepareContractCall({ contract, abi, method: "deactivateContributor", params: [company.walletAddress] })}
                onTransactionConfirmed={() => { alert("Azienda disattivata on-chain!"); updateOffChainStatus('deactivate'); }}
                onError={(error) => alert(`Errore: ${error.message}`)}
                className="web3-button" style={{backgroundColor: '#f59e0b'}}
              >
                ❌ Disattiva Contributor
              </TransactionButton>
            )}
            {company.status === 'deactivated' && (
              <TransactionButton
                transaction={() => prepareContractCall({ contract, abi, method: "addContributor", params: [company.walletAddress, company.companyName] })}
                onTransactionConfirmed={() => { alert("Azienda riattivata on-chain!"); updateOffChainStatus('reactivate'); }}
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
            transaction={() => prepareContractCall({ contract, abi, method: "setContributorCredits", params: [company.walletAddress, BigInt(credits)] })}
            onTransactionConfirmed={() => { alert("Crediti impostati on-chain!"); updateOffChainStatus('setCredits'); }}
            onError={(error) => alert(`Errore: ${error.message}`)}
            className="web3-button" style={{marginTop: '0.5rem', width: '100%'}}
            disabled={company.status === 'pending'}>
            Aggiorna Crediti
          </TransactionButton>
        </div>
        
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
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

    const fetchCompanies = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/get-pending-companies');
            if (!response.ok) { throw new Error(`Errore HTTP: ${response.status}`); }
            const data = await response.json();
            const pending = (data.pending || []).map((p: any) => ({ ...p, status: 'pending' }));
            const active = (data.active || []).map((a: any) => ({ ...a, status: 'active' }));
            setAllCompanies([...pending, ...active]);
        } catch (err: any) { setError(`Impossibile caricare i dati: ${err.message}`); }
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
            {error && <p style={{ color: '#ef4444' }}>{error}</p>}
            <table className="company-table">
                <thead><tr><th>Stato</th><th>Nome Azienda</th><th>Wallet</th><th>Email</th><th>Azione</th></tr></thead>
                <tbody>
                    {isLoading ? (<tr><td colSpan={5} style={{textAlign: 'center', padding: '2rem'}}>Caricamento...</td></tr>) : 
                    filteredCompanies.length > 0 ? (
                        filteredCompanies.map(c => (
                        <tr key={c.id}>
                            <td>{c.status === 'active' ? '✅' : c.status === 'pending' ? '⏳' : '❌'}</td>
                            <td>{c.companyName}</td><td>{c.walletAddress}</td><td>{c.contactEmail || "/"}</td>
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
const AdminContent = () => {
  const account = useActiveAccount();
  const [isAllowed, setIsAllowed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (account) {
        setIsLoading(true);
        try {
          const [superOwner, owner] = await Promise.all([
            readContract({ contract, abi, method: "function superOwner() view returns (address)" }),
            readContract({ contract, abi, method: "function owner() view returns (address)" })
          ]);
          const isAdmin = account.address.toLowerCase() === superOwner.toLowerCase() || (owner && account.address.toLowerCase() === owner.toLowerCase());
          setIsAllowed(isAdmin);
        } catch (e) { setIsAllowed(false); }
        finally { setIsLoading(false); }
      } else { setIsAllowed(false); }
    };
    checkPermissions();
  }, [account]);

  if (isLoading) { return <p style={{textAlign: 'center', marginTop: '2rem'}}>Verifica permessi in corso...</p>; }
  if (isAllowed) { return <div><h3>Benvenuto, SFY Labs!</h3><CompanyList /></div>; }
  return <h2 style={{ color: '#ef4444', fontSize: '2rem', marginTop: '4rem' }}>❌ ACCESSO NEGATO</h2>;
};


export default function AdminPage() {
  const account = useActiveAccount();
  
  return (
    <div className="app-container">
      <main className="main-content" style={{width: '100%'}}>
        <header className="header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Pannello Amministrazione</h1>
          <ConnectButton client={client} chain={polygon} />
        </header>
        {account ? <AdminContent /> : <p>Connetti il tuo wallet da amministratore per accedere.</p>}
      </main>
    </div>
  );
}
