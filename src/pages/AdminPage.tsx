// FILE: src/pages/AdminPage.tsx
// AGGIORNATO: Ora legge i dati reali dal contratto e rimuove i dati finti.

import React, { useState, useEffect } from "react";
import { ConnectWallet, useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
import "../App.css";

const contractAddress = "0x4a866C3A071816E3186e18cbE99a3339f4571302";

// --- LISTA AZIENDE IN PENDING (ORA VUOTA) ---
// In un'applicazione reale, questi dati proverrebbero da un tuo database (Firebase, Supabase, etc.)
const pendingCompanies = []; // Non inventiamo più dati!

// --- NUOVO COMPONENTE: Riga per una singola azienda attiva ---
// Questo componente si occupa di caricare e mostrare i dati di UNA SOLA azienda attiva.
const ActiveCompanyRow = ({ address }: { address: string }) => {
  const { contract } = useContract(contractAddress);
  
  // Usiamo useContractRead per leggere i dati di QUESTA specifica azienda dal contratto
  const { data: contributorInfo, isLoading } = useContractRead(
    contract,
    "getContributorInfo",
    [address]
  );

  if (isLoading) {
    return (
      <tr>
        <td>✅</td>
        <td colSpan={3}>Caricamento dati on-chain...</td>
      </tr>
    );
  }

  // Estraiamo il nome reale dal contratto (è il primo elemento dell'array restituito)
  const companyName = contributorInfo?.[0] || "Nome non trovato";

  return (
    <tr className="clickable-row">
      <td>✅</td>
      <td>{companyName}</td>
      <td>{address}</td>
      <td>/</td> {/* Come richiesto, mettiamo "/" per l'email */}
    </tr>
  );
};


// --- COMPONENTE PER LA LISTA DELLE AZIENDE ---
const CompanyList = () => {
  // --- LISTA STATICA DEGLI INDIRIZZI ATTIVI ---
  // In un'app reale, avresti un tuo sistema per sapere quali indirizzi hai attivato.
  // Per ora, inseriamo qui manualmente l'indirizzo che hai attivato.
  const activeCompanyAddresses = [
      "0x4Fe787C456CD58b03Aa33097CDA19F80893DB96F",
      // Se attivi altre aziende, aggiungi i loro indirizzi qui
  ];

  // Stati per la ricerca e il filtro
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Per ora, la lista filtrata conterrà solo i dati delle aziende attive.
  // La ricerca e il filtro verranno applicati in futuro quando avremo più dati.
  // Questo è un punto di partenza per una logica più complessa.
  
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
          {/* Mostriamo solo le aziende attive se il filtro è 'all' o 'active' */}
          {(filterStatus === 'all' || filterStatus === 'active') && 
            activeCompanyAddresses.map(address => (
              <ActiveCompanyRow key={address} address={address} />
          ))}

          {/* Qui in futuro potremmo mostrare le aziende in pending dal database */}
          {pendingCompanies.length === 0 && (filterStatus === 'all' || filterStatus === 'pending') && (
            <tr>
              <td colSpan={4} style={{textAlign: 'center', padding: '1rem', color: '#a0a0a0'}}>Nessuna richiesta di attivazione in sospeso.</td>
            </tr>
          )}
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
