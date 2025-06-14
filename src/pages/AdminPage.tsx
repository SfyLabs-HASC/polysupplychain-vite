// FILE: src/pages/AdminPage.tsx
// AGGIORNATO con console.log per un debugging più efficace.

import React, { useState, useEffect, useCallback } from "react";
import { ConnectWallet, useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
import "../App.css";

const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302";

// ... (EditCompanyModal non cambia, ma deve essere presente nel file)

const CompanyList = () => {
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Stato per memorizzare gli errori
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null); // Resetta l'errore a ogni nuovo caricamento
    console.log("Inizio caricamento dati...");

    try {
      const response = await fetch('/api/get-pending-companies');
      console.log("Risposta API ricevuta, status:", response.status);

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log("Dati ricevuti dall'API:", data);

      const pending = data.pending || [];
      const active = data.active || [];
      
      console.log(`Trovate ${pending.length} aziende in pending e ${active.length} aziende attive.`);
      
      setAllCompanies([...pending, ...active]);

    } catch (err: any) {
      console.error("ERRORE CRITICO DURANTE IL CARICAMENTO:", err);
      setError(`Impossibile caricare i dati. Errore: ${err.message}`);
      setAllCompanies([]); // Pulisce i dati in caso di errore
    } finally {
      setIsLoading(false);
      console.log("Caricamento completato.");
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    // ... la logica di filtro non cambia ...
    let companies = [...allCompanies];
    if (filterStatus !== "all") { companies = companies.filter(c => c.status === filterStatus); }
    if (searchTerm) { companies = companies.filter(c => c.companyName.toLowerCase().includes(searchTerm.toLowerCase())); }
    setFilteredCompanies(companies);
  }, [searchTerm, filterStatus, allCompanies]);

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* ... la UI dei filtri non cambia ... */}
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <table className="company-table">
        {/* ... la tabella rimane uguale ... */}
      </table>
      {/* ... la modale rimane uguale ... */}
    </div>
  );
};


// ... Il resto del file (AdminPage, EditCompanyModal, etc.) non cambia ...
export default function AdminPage() {
    // ...
    return <div>...</div>
}

