// FILE: src/pages/AdminPage.tsx
// QUESTA È LA VERSIONE COMPLETA E CORRETTA CHE RISOLVE IL PROBLEMA DELLA PAGINA VUOTA

import React, { useState, useEffect, useCallback } from "react";
import { ConnectWallet, useAddress, useContract, useContractRead, Web3Button } from "@thirdweb-dev/react";
import "../App.css";

// Definizione del tipo per un'azienda
type Company = {
  id: string;
  companyName: string;
  walletAddress: string;
  status: 'active' | 'pending' | 'deactivated';
  credits?: number;
};

const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302";

// --- Componente Modale per la Modifica ---
// (Questo componente non era nel codice precedente, lo aggiungo ora)
const EditCompanyModal = ({ company, onClose, onUpdate }: { company: Company, onClose: () => void, onUpdate: () => void }) => {
    // ... la logica della modale che avevamo prima ...
    // Per ora la lasciamo vuota per concentrarci sulla visualizzazione della lista
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Gestisci: {company.companyName}</h2>
                <p>Le azioni di gestione verranno implementate qui.</p>
                <button onClick={onClose} style={{marginTop: '2rem'}}>Chiudi</button>
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
    console.log("DEBUG: Inizio caricamento dati...");

    try {
      const response = await fetch('/api/get-pending-companies');
      console.log("DEBUG: Risposta API ricevuta, status:", response.status);

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log("DEBUG: Dati JSON ricevuti dall'API:", data);

      const pending = (data.pending || []).map((p: any) => ({ ...p, status: 'pending' }));
      const active = (data.active || []).map((a: any) => ({ ...a, status: 'active' }));
      
      console.log(`DEBUG: Trovate ${pending.length} aziende in pending e ${active.length} aziende attive.`);
      
      setAllCompanies([...pending, ...active]);

    } catch (err: any) {
      console.error("ERRORE CRITICO DURANTE IL CARICAMENTO:", err);
      setError(`Impossibile caricare i dati. Errore: ${err.message}`);
      setAllCompanies([]);
    } finally {
      setIsLoading(false);
      console.log("DEBUG: Caricamento completato.");
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

  return (
    <div style={{ marginTop: '2rem' }}>
      <div className="filters-container">
        <input type="text" placeholder="Cerca per nome..." className="form-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '300px' }}/>
        <select className="form-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '200px' }}>
          <option value="all">Tutti</option><option value="active">Attivate</option><option value="pending">In Pending</option>
        </select>
      </div>

      {error && <p style={{ color: '#ef4444', marginTop: '1rem' }}>{error}</p>}
      
      <table className="company-table">
        <thead><tr><th>Stato</th><th>Nome Azienda</th><th>Wallet Address</th><th>Email Contatto</th></tr></thead>
        <tbody>
          {isLoading ? (<tr><td colSpan={4} style={{textAlign: 'center', padding: '2rem'}}>Caricamento dati...</td></tr>) : 
           filteredCompanies.length > 0 ? (
            filteredCompanies.map(c => (
              <tr key={c.id}>
                <td>{c.status === 'active' ? '✅' : '⏳'}</td>
                <td>{c.companyName}</td>
                <td>{c.walletAddress}</td>
                <td>{c.contactEmail || "/"}</td>
              </tr>
            ))
           ) : (<tr><td colSpan={4} style={{textAlign: 'center', padding: '2rem'}}>Nessuna azienda trovata.</td></tr>)}
        </tbody>
      </table>
    </div>
  );
};


// --- Componente Principale della Pagina Admin ---
const AdminContent = () => {
    const address = useAddress();
    const { contract } = useContract(contractAddress);
    
    const { data: superOwner, isLoading: isLoadingSuperOwner } = useContractRead(contract, "superOwner");
    const { data: owner, isLoading: isLoadingOwner } = useContractRead(contract, "owner");

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

        {address ? <AdminContent /> : <p>Connetti il tuo wallet da amministratore per accedere.</p>}
      </main>
    </div>
  );
}
