// FILE: src/pages/AdminPage.tsx
// QUESTA È LA VERSIONE FINALE CHE RIPRISTINA TUTTE LE FUNZIONALITÀ DI GESTIONE

import React, { useState, useEffect, useCallback } from "react";
import { ConnectWallet, useAddress, useContract, useContractRead, useContractWrite, Web3Button } from "@thirdweb-dev/react";
import "../App.css";

// Definizione del tipo per un'azienda per una migliore gestione in TypeScript
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

      alert(`Azienda ${company.companyName} attivata con successo!`);
      onUpdate(); // Ricarica la lista
      onClose();  // Chiude la modale
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
            <label>Crediti da Assegnare/Impostare</label>
            <input type="number" value={credits} onChange={(e) => setCredits(Number(e.target.value))} className="form-input" />
            
            <Web3Button
              contractAddress={contractAddress}
              action={() => setContributorCredits({ args: [company.walletAddress, credits] })}
              onSuccess={() => alert("Crediti aggiornati con successo!")}
              onError={(error) => alert(`Errore: ${error.message}`)}
              className="web3-button"
              style={{marginTop: '0.5rem'}}
              isDisabled={company.status === 'pending' || isLoading} // Disabilitato se in pending o se sta già processando
            >
              {isSettingCredits ? 'Impostando...' : 'Imposta Crediti'}
            </Web3Button>
        </div>
        
        <hr style={{margin: '1rem 0', borderColor: '#27272a'}}/>

        <div className="modal-actions">
            {/* Pulsante per ATTIVARE un'azienda in pending */}
            {company.status === 'pending' && (
              <button onClick={handleActivate} disabled={isLoading} className="web3-button"> 
                {isLoading ? "Attivazione..." : "✅ Attiva Contributor"} 
              </button>
            )}
            
            {/* Pulsante per DISATTIVARE un'azienda attiva */}
            {company.status === 'active' && (
              <Web3Button
                contractAddress={contractAddress}
                action={() => deactivateContributor({ args: [company.walletAddress] })}
                onSuccess={() => alert("Azienda disattivata on-chain.")} // Dovresti anche aggiornare il DB qui
                onError={(error) => alert(`Errore: ${error.message}`)}
                className="web3-button"
                style={{backgroundColor: '#f59e0b'}}
                isDisabled={isLoading}
              >
                {isDeactivating ? "Disattivando..." : "Disattiva Contributor"}
              </Web3Button>
            )}
        </div>

        <button onClick={onClose} disabled={isLoading} style={{marginTop: '2rem', background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer'}}>
            Chiudi
        </button>
      </div>
    </div>
  );
};

// --- Componente per la Lista delle Aziende ---
const CompanyList = () => {
    // ... Questo componente rimane identico a quello dell'ultima versione funzionante ...
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
