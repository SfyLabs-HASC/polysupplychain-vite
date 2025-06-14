// FILE: src/pages/AdminPage.tsx
// Versione completa con dashboard, lista aziende, filtri e ricerca.

import React, { useState, useEffect } from "react";
import { ConnectWallet, useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
import "../App.css"; // Usiamo gli stili globali

const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302";

// --- SIMULAZIONE DATABASE OFF-CHAIN ---
// In un'applicazione reale, questi dati proverrebbero da un tuo database (es. Firebase, Supabase, etc.)
// dove salvi le richieste che ricevi via email.
const pendingCompaniesMock = [
  {
    id: 'pending-1',
    companyName: "Caseificio La Perla",
    contactEmail: "info@caseificioperla.it",
    walletAddress: "0xAbC...123",
    status: 'pending' as const, // Usiamo 'as const' per una tipizzazione più forte
  },
  {
    id: 'pending-2',
    companyName: "Vigneti Rossi",
    contactEmail: "info@vignetirossi.com",
    walletAddress: "0xDeF...456",
    status: 'pending' as const,
  }
];

// --- COMPONENTE PER LA LISTA DELLE AZIENDE ---
// Questo componente legge i dati dal contratto e li unisce a quelli del nostro "database" finto.
const CompanyList = () => {
  const { contract } = useContract(contractAddress);
  
  // Per ora, leggiamo una lista di aziende "attive" che inseriamo manualmente qui.
  // In futuro, questo verrebbe da un evento o da un indexer.
  const activeCompanyAddresses = [
      "0x4Fe787C456CD58b03Aa33097CDA19F80893DB96F", // Esempio di un'azienda già attivata
      // Aggiungi qui altri indirizzi di aziende attive
  ];

  // Stati per la ricerca e il filtro
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Qui useremo i dati finti. In un'app reale, questi verrebbero da chiamate API.
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);

  useEffect(() => {
    // Simula il caricamento dei dati
    // Nota: in un'app reale, qui faresti una chiamata per ottenere i dati on-chain.
    // Per ora, creiamo una lista fittizia.
    const activeCompanies = activeCompanyAddresses.map(addr => ({
      id: addr,
      companyName: `Azienda Attiva ${addr.slice(0,6)}`, // Nome fittizio
      contactEmail: "onchain@email.com",
      walletAddress: addr,
      status: 'active' as const,
    }));
    
    // Escludiamo dalle pending quelle già attivate
    const uniquePending = pendingCompaniesMock.filter(p => !activeCompanyAddresses.includes(p.walletAddress));

    setAllCompanies([...activeCompanies, ...uniquePending]);
  }, []);

  useEffect(() => {
    let companies = [...allCompanies];

    // Applica filtro per stato
    if (filterStatus !== "all") {
      companies = companies.filter(c => c.status === filterStatus);
    }

    // Applica filtro per nome
    if (searchTerm) {
      companies = companies.filter(c => 
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredCompanies(companies);
  }, [searchTerm, filterStatus, allCompanies]);

  return (
    <div style={{ marginTop: '2rem' }}>
      <div className="filters-container">
        <input 
          type="text" 
          placeholder="Cerca per nome azienda..."
          className="form-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '300px', marginRight: '1rem' }}
        />
        <select 
          className="form-input"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ width: '200px' }}
        >
          <option value="all">Mostra Tutti</option>
          <option value="active">Solo Attivate</option>
          <option value="pending">Solo in Pending</option>
        </select>
      </div>

      <table className="company-table">
        <thead>
          <tr>
            <th>Stato</th>
            <th>Nome Azienda</th>
            <th>Wallet Address</th>
            <th>Email Contatto</th>
          </tr>
        </thead>
        <tbody>
          {filteredCompanies.map(company => (
            <tr key={company.id} className="clickable-row">
              <td>
                {company.status === 'active' ? '✅' : '⏳'}
              </td>
              <td>{company.companyName}</td>
              <td>{company.walletAddress}</td>
              <td>{company.contactEmail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


// --- COMPONENTE PRINCIPALE DELLA PAGINA ADMIN ---
export default function AdminPage() {
  const address = useAddress();
  const { contract } = useContract(contractAddress);
  const { data: superOwner } = useContractRead(contract, "superOwner");
  const { data: owner } = useContractRead(contract, "owner");

  const isSuperOwner = address && superOwner && address.toLowerCase() === superOwner.toLowerCase();
  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();
  
  return (
    <div className="app-container">
      <main className="main-content" style={{width: '100%', padding: '2rem 4rem'}}>
        <header className="header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          {/* MODIFICATO: Spostiamo il titolo qui */}
          <h1 className="page-title">Pannello Amministrazione</h1>
          <ConnectWallet theme="dark" btnTitle="Connetti"/>
        </header>

        {/* Controllo accesso */}
        {!address ? (
          <p>Connetti il tuo wallet da amministratore per accedere.</p>
        ) : (isSuperOwner || isOwner) ? (
          <div>
            <h3>Benvenuto, SFY Labs!</h3>
            <CompanyList />
          </div>
        ) : (
          <h2 style={{ color: '#ef4444', fontSize: '2rem', marginTop: '4rem' }}>❌ ACCESSO NEGATO</h2>
        )}
      </main>
    </div>
  );
}
