// FILE: src/pages/AdminPage.tsx
// AGGIORNATO: Ora carica i dati reali dal database Firestore e dal contratto.

import React, { useState, useEffect } from "react";
import { ConnectWallet, useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
import "../App.css";

const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302";


// --- Componente per la Lista delle Aziende (Logica Migliorata) ---
const CompanyList = () => {
  const { contract } = useContract(contractAddress);
  
  // Stati per le nostre liste di dati
  const [pendingCompanies, setPendingCompanies] = useState<any[]>([]);
  const [activeCompanies, setActiveCompanies] = useState<any[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stati per i filtri
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // In un'app reale, questa lista verrebbe da un evento o da un tuo database.
  // Per ora, inseriamo qui manualmente gli indirizzi che hai già attivato.
  const activeCompanyAddresses = [
      "0x4Fe787C456CD58b03Aa33097CDA19F80893DB96F",
      // Aggiungi qui altri indirizzi di aziende attive se ne attivi di nuove
  ];
  
  // Effetto per caricare tutti i dati quando il componente viene montato
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);

      // --- 1. Carica le aziende in PENDING dalla nostra API ---
      try {
        const pendingResponse = await fetch('/api/get-pending-companies');
        if (pendingResponse.ok) {
          const pendingData = await pendingResponse.json();
          // Aggiungiamo lo stato per coerenza
          setPendingCompanies(pendingData.map((p: any) => ({ ...p, status: 'pending' })));
        } else {
          console.error("Errore nel caricare le aziende in pending");
          setPendingCompanies([]);
        }
      } catch (error) {
        console.error("Errore API:", error);
        setPendingCompanies([]);
      }

      // --- 2. Carica i dati delle aziende ATTIVE dal contratto ---
      if (contract && activeCompanyAddresses.length > 0) {
        try {
          const activePromises = activeCompanyAddresses.map(address => 
            contract.call("getContributorInfo", [address])
          );
          const activeResults = await Promise.all(activePromises);
          
          const activeData = activeResults.map((info, index) => ({
            id: activeCompanyAddresses[index],
            companyName: info[0] || "Nome non trovato", // Nome reale dal contratto
            walletAddress: activeCompanyAddresses[index],
            contactEmail: "/", // Email non è on-chain
            status: 'active' as const,
          }));
          setActiveCompanies(activeData);
        } catch (error) {
          console.error("Errore nel caricare le aziende attive", error);
        }
      } else {
        setActiveCompanies([]);
      }
      setIsLoading(false);
    };

    fetchAllData();
  }, [contract]);

  // Effetto per applicare i filtri quando cambiano i dati o le opzioni di filtro
  useEffect(() => {
    let allCompanies = [...activeCompanies, ...pendingCompanies];

    // Applica filtro per stato
    if (filterStatus !== "all") {
      allCompanies = allCompanies.filter(c => c.status === filterStatus);
    }

    // Applica filtro per nome
    if (searchTerm) {
      allCompanies = allCompanies.filter(c => 
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredCompanies(allCompanies);
  }, [searchTerm, filterStatus, activeCompanies, pendingCompanies]);

  return (
    <div style={{ marginTop: '2rem' }}>
      <div className="filters-container">
        <input 
          type="text" 
          placeholder="Cerca per nome azienda..."
          className="form-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '300px' }}
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
          {isLoading ? (
            <tr><td colSpan={4} style={{textAlign: 'center', padding: '2rem'}}>Caricamento dati...</td></tr>
          ) : filteredCompanies.length > 0 ? (
            filteredCompanies.map(company => (
              <tr key={company.id} className="clickable-row">
                <td>{company.status === 'active' ? '✅' : '⏳'}</td>
                <td>{company.companyName}</td>
                <td>{company.walletAddress}</td>
                <td>{company.contactEmail}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={4} style={{textAlign: 'center', padding: '2rem'}}>Nessuna azienda trovata.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};


// --- Componente Principale della Pagina Admin ---
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
          <h1 className="page-title">Pannello Amministrazione</h1>
          <ConnectWallet theme="dark" btnTitle="Connetti"/>
        </header>

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
