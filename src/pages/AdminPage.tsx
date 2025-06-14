// FILE: src/pages/AdminPage.tsx
// AGGIORNATO: Ora la tabella include i crediti e il numero di batch completati.

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

// --- Componente per una singola riga della tabella ---
// Ora ogni riga gestisce il caricamento dei propri dati on-chain.
const CompanyRow = ({ company, onManageClick }: { company: Company, onManageClick: (company: Company) => void }) => {
  const { contract } = useContract(contractAddress);

  // Leggiamo le info (nome, crediti, stato) per questa specifica azienda
  const { data: contributorInfo, isLoading: isLoadingInfo } = useContractRead(
    contract, "getContributorInfo", [company.walletAddress], { enabled: company.status === 'active' }
  );

  // Leggiamo il numero di batch per questa specifica azienda
  const { data: batchIds, isLoading: isLoadingBatches } = useContractRead(
    contract, "getBatchesByContributor", [company.walletAddress], { enabled: company.status === 'active' }
  );

  const displayName = company.status === 'active' ? (contributorInfo?.[0] || company.companyName) : company.companyName;
  const displayCredits = company.status === 'active' ? (contributorInfo?.[1].toString() || 'N/A') : '/';
  const displayBatchCount = company.status === 'active' ? (batchIds?.length.toString() || '0') : '/';
  const isLoading = isLoadingInfo || isLoadingBatches;

  return (
    <tr>
      <td>{company.status === 'active' ? '✅' : '⏳'}</td>
      <td>{displayName}</td>
      <td>{company.walletAddress}</td>
      <td>{displayCredits}</td>
      <td>{displayBatchCount}</td>
      <td><button onClick={() => onManageClick(company)} className="web3-button" style={{padding: '0.5rem 1rem'}}>Gestisci</button></td>
    </tr>
  );
};


// --- Componente Modale per la Modifica (invariato) ---
const EditCompanyModal = ({ company, onClose, onUpdate }: { company: Company, onClose: () => void, onUpdate: () => void }) => {
  // Il codice di questo componente rimane identico a prima.
  // ...
  return <div className="modal-overlay">...</div>; // Contenuto omesso per brevità
};


// --- Componente per la Lista delle Aziende ---
const CompanyList = () => {
    // ... (La logica per caricare i dati e filtrare rimane la stessa di prima) ...
    const [allCompanies, setAllCompanies] = useState<Company[]>([]);
    const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

    const fetchCompanies = useCallback(async () => {
      // ... (La logica per chiamare /api/get-pending-companies è la stessa) ...
    }, []);

    useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

    useEffect(() => {
        // ... (La logica di filtro è la stessa) ...
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
                        <th>Wallet Address</th>
                        <th>Crediti</th>
                        <th>Batch Creati</th>
                        <th>Azione</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (<tr><td colSpan={6} style={{textAlign: 'center', padding: '2rem'}}>Caricamento...</td></tr>) : 
                    filteredCompanies.length > 0 ? (
                        filteredCompanies.map(c => (
                            <CompanyRow key={c.id} company={c} onManageClick={setSelectedCompany} />
                        ))) : 
                    (<tr><td colSpan={6} style={{textAlign: 'center', padding: '2rem'}}>Nessuna azienda trovata.</td></tr>)}
                </tbody>
            </table>
            {selectedCompany && <EditCompanyModal company={selectedCompany} onClose={() => setSelectedCompany(null)} onUpdate={fetchCompanies} />}
        </div>
    );
};


// --- Componente Principale della Pagina Admin ---
export default function AdminPage() {
    // ... Questo componente rimane identico a prima ...
    const address = useAddress();
    // ... resto della logica di accesso ...

    return (
        <div className="app-container">
            <main className="main-content" style={{width: '100%'}}>
                <header className="header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 className="page-title">Pannello Amministrazione</h1>
                    <ConnectWallet theme="dark" btnTitle="Connetti"/>
                </header>
                {/* ... resto della UI ... */}
            </main>
        </div>
    );
}

