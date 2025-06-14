// FILE: src/pages/AdminPage.tsx
// CORRETTO: Risolto l'errore di build rimuovendo l'opzione "enabled".

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
const CompanyRow = ({ company, onManageClick }: { company: Company, onManageClick: (company: Company) => void }) => {
  const { contract } = useContract(contractAddress);

  // CORREZIONE: Invece di usare "enabled", passiamo 'undefined' come argomento se la condizione non è vera.
  // L'hook non partirà se non ha un indirizzo valido da interrogare.
  const { data: contributorInfo, isLoading: isLoadingInfo } = useContractRead(
    contract, "getContributorInfo", company.status === 'active' ? [company.walletAddress] : undefined
  );

  const { data: batchIds, isLoading: isLoadingBatches } = useContractRead(
    contract, "getBatchesByContributor", company.status === 'active' ? [company.walletAddress] : undefined
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


// --- Componente Modale per la Modifica ---
const EditCompanyModal = ({ company, onClose, onUpdate }: { company: Company, onClose: () => void, onUpdate: () => void }) => {
  // Il codice di questo componente è corretto e rimane invariato
  // ... (Contenuto omesso per brevità, ma deve essere presente nel tuo file)
};


// --- Componente per la Lista delle Aziende ---
const CompanyList = () => {
    // Il codice di questo componente è corretto e rimane invariato
    // ... (Contenuto omesso per brevità, ma deve essere presente nel tuo file)
};


// --- Componente Principale della Pagina Admin ---
export default function AdminPage() {
    // Il codice di questo componente è corretto e rimane invariato
    // ... (Contenuto omesso per brevità, ma deve essere presente nel tuo file)
}
