// FILE: src/pages/AdminPage.tsx
// AGGIORNATO: Versione più robusta con controlli di caricamento migliorati.

import React, { useState, useEffect, useCallback } from "react";
import { ConnectWallet, useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
import "../App.css";

const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302";

// --- Componente per la Lista delle Aziende ---
const CompanyList = () => {
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/get-companies');
      const data = await response.json();
      if (response.ok) {
        const pending = data.pending || [];
        const active = data.active || [];
        setAllCompanies([...pending, ...active]);
      } else {
        throw new Error(data.error || "Errore nel caricare i dati delle aziende");
      }
    } catch (error) {
      console.error("Errore caricamento aziende:", error);
      setAllCompanies([]); // In caso di errore, imposta un array vuoto
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    let companies = [...allCompanies];
    if (filterStatus !== "all") { companies = companies.filter(c => c.status === filterStatus); }
    if (searchTerm) { companies = companies.filter(c => c.companyName.toLowerCase().includes(searchTerm.toLowerCase())); }
    setFilteredCompanies(companies);
  }, [searchTerm, filterStatus, allCompanies]);

  const handleActivate = async (company: any) => {
    const credits = prompt(`Quanti crediti vuoi assegnare a ${company.companyName}?`, "50");
    if (!credits || isNaN(parseInt(credits))) { alert("Inserisci un numero valido."); return; }
    try {
      const response = await fetch('/api/activate-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: company.walletAddress, companyName: company.companyName, initialCredits: parseInt(credits) }),
      });
      const result = await response.json();
      if (response.ok) { alert(result.message); fetchCompanies(); } 
      else { throw new Error(result.error); }
    } catch (error: any) { alert(`Attivazione fallita: ${error.message}`); }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <div className="filters-container">
        <input type="text" placeholder="Cerca per nome..." className="form-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '300px' }}/>
        <select className="form-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '200px' }}>
          <option value="all">Tutti</option><option value="active">Attivate</option><option value="pending">In Pending</option>
        </select>
      </div>
      <table className="company-table">
        <thead><tr><th>Stato</th><th>Nome Azienda</th><th>Wallet Address</th><th>Azione</th></tr></thead>
        <tbody>
          {isLoading ? (<tr><td colSpan={4} style={{textAlign: 'center', padding: '2rem'}}>Caricamento dati...</td></tr>) : 
           filteredCompanies.length > 0 ? (
            filteredCompanies.map(c => (
              <tr key={c.id}>
                <td>{c.status === 'active' ? '✅' : c.status === 'pending' ? '⏳' : '❌'}</td>
                <td>{c.companyName}</td><td>{c.walletAddress}</td>
                <td>{c.status === 'pending' && <button onClick={() => handleActivate(c)} className="web3-button" style={{padding: '0.5rem 1rem'}}>Attiva</button>}</td>
              </tr>
            ))
           ) : (<tr><td colSpan={4} style={{textAlign: 'center', padding: '2rem'}}>Nessuna azienda trovata.</td></tr>)}
        </tbody>
      </table>
      {/* La modale per la modifica verrà aggiunta in un secondo momento */}
    </div>
  );
};


// --- Componente Principale della Pagina Admin ---
const AdminContent = () => {
    const address = useAddress();
    const { contract } = useContract(contractAddress);
    
    // Controlli separati e più robusti
    const { data: superOwner, isLoading: isLoadingSuperOwner } = useContractRead(contract, "superOwner");
    const { data: owner, isLoading: isLoadingOwner } = useContractRead(contract, "owner");

    // Mostra il caricamento mentre leggiamo i permessi
    if (isLoadingSuperOwner || isLoadingOwner) {
        return <p style={{marginTop: '2rem'}}>Verifica permessi in corso...</p>;
    }

    const isAllowed = address && (
        (superOwner && address.toLowerCase() === superOwner.toLowerCase()) ||
        (owner && address.toLowerCase() === owner.toLowerCase())
    );

    if (isAllowed) {
        return (
            <div>
                <h3>Benvenuto, SFY Labs!</h3>
                <CompanyList />
            </div>
        );
    }

    return <h2 style={{ color: '#ef4444', fontSize: '2rem', marginTop: '4rem' }}>❌ ACCESSO NEGATO</h2>;
}


export default function AdminPage() {
  const address = useAddress();
  
  return (
    <div className="app-container">
      <main className="main-content" style={{width: '100%'}}>
        <header className="header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Pannello Amministrazione</h1>
          <ConnectWallet theme="dark" btnTitle="Connetti"/>
        </header>

        {/* Mostra il contenuto solo se il wallet è connesso */}
        {address ? <AdminContent /> : <p>Connetti il tuo wallet da amministratore per accedere.</p>}

      </main>
    </div>
  );
}
