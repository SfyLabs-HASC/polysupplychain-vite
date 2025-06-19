// FILE: src/pages/AziendaPage.tsx
// (CODICE CORRETTO E FUNZIONANTE)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall, readContract, toEther } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { upload } from 'thirdweb/storage';
import { supplyChainABI as abi } from '../abi/contractABI';
import '../App.css';
import TransactionStatusModal from '../components/TransactionStatusModal';

const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({
  client,
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});

// Componente Header (corretto, rimane invariato)
const DashboardHeader = ({ contributorInfo }: { contributorInfo: any }) => {
  const companyName = contributorInfo ? contributorInfo[0] : 'Azienda';
  const credits = contributorInfo ? contributorInfo[1].toString() : '...';

  return (
    <div className="dashboard-header-card">
      <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '3rem' }}>{companyName}</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div className="status-item">
          <span>Crediti Rimanenti: <strong>{credits}</strong></span>
        </div>
        <div className="status-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Stato: <strong>ATTIVO</strong></span>
          <span className="status-icon">✅</span>
        </div>
      </div>
    </div>
  );
};

// --- MODAL PER NUOVA ISCRIZIONE (INTERAMENTE CORRETTO) ---
const NuovaIscrizioneModal = ({ contributorInfo, onClose, onSuccess }: { contributorInfo: any, onClose: () => void, onSuccess: () => void }) => {
  // MODIFICA: Aggiunto lo stato per TUTTI i campi del form
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { mutate: sendTransaction, isPending } = useSendTransaction();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // MODIFICA: Aggiunto controllo su tutti i campi
    if (!productName || !description || !location || !date) {
      setError('Tutti i campi di testo sono obbligatori.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      let imageHash = "N/A";
      if (imageFile) {
        const uris = await upload({ client, files: [imageFile] });
        imageHash = (Array.isArray(uris) ? uris[0] : uris).replace("ipfs://", "");
      }

      const transaction = prepareContractCall({
        contract,
        method: "function createBatch(string _contributorName, string _productName, string _description, string _date, string _location, string _imageHash) returns (uint256)",
        // MODIFICA: Passati i valori corretti presi dallo stato
        params: [
          contributorInfo[0],
          productName,
          description,
          date,
          location,
          imageHash
        ],
        abi
      });

      sendTransaction(transaction, {
        onSuccess: () => {
          setIsSubmitting(false);
          onSuccess();
          onClose();
        },
        onError: (err) => {
          setError(`Errore durante la transazione: ${err.message}`);
          setIsSubmitting(false);
        }
      });
    } catch (err: any) {
      setError(`Errore imprevisto: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Crea Nuova Iscrizione</h2>
        <form onSubmit={handleSubmit}>
          <label>Nome Prodotto / Batch</label>
          <input type="text" placeholder="Es: Pomodoro San Marzano DOP" value={productName} onChange={(e) => setProductName(e.target.value)} required />

          {/* MODIFICA: Collegato lo stato a questo textarea */}
          <label>Descrizione</label>
          <textarea placeholder="Descrizione del prodotto, lotto, caratteristiche..." value={description} onChange={(e) => setDescription(e.target.value)} required />

          {/* MODIFICA: Collegato lo stato a questo input */}
          <label>Luogo di riferimento</label>
          <input type="text" placeholder="Es: Agro Sarnese-Nocerino" value={location} onChange={(e) => setLocation(e.target.value)} required />
          
          {/* MODIFICA: Collegato lo stato a questo input */}
          <label>Data di riferimento</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />

          <label>Immagine (Opzionale)</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          
          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="button-secondary" onClick={onClose} disabled={isSubmitting || isPending}>Annulla</button>
            <button type="submit" className="web3-button" disabled={isSubmitting || isPending}>
              {isSubmitting || isPending ? 'Creazione in Corso...' : 'Crea Iscrizione'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// Componente BatchCard (rimane invariato)
const BatchCard = ({ batch, batchId }: { batch: any, batchId: number }) => {
  const defaultImageUrl = "https://musical-emerald-partridge.myfilebase.com/ipfs/QmNUGt9nxmkV27qF56jFAG9FUPABvGww5TTW9R9vh2TdvB";
  const imageUrl = batch[7] && batch[7] !== "N/A" ? `https://musical-emerald-partridge.myfilebase.com/ipfs/${batch[7]}` : defaultImageUrl;

  return (
    <div className="card">
      <img src={imageUrl} alt={batch[3]} className="card-image" />
      <div className="card-content">
        <span className={`card-status ${batch[8] ? 'closed' : 'open'}`}>{batch[8] ? 'Chiuso' : 'Aperto'}</span>
        <h3 className="card-title">{batch[3]}</h3>
        <p className="card-description">{batch[4]}</p>
        <div className="card-footer">
          <Link to={`/gestisci/${batchId}`}>
            <button className="web3-button">Gestisci Iscrizione</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

// Componente principale (logica aggiornata per refresh)
export default function AziendaPage() {
  const account = useActiveAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Stato per forzare il refresh

  const { data: contributorInfo, refetch: refetchContributorInfo } = useReadContract({
    contract,
    method: "function getContributorInfo(address) view returns (string, uint256, bool)",
    params: account ? [account.address] : undefined,
    queryOptions: { enabled: !!account }
  });

  const { data: batches, refetch: refetchBatches } = useReadContract({
    contract,
    method: "function getBatchesByContributor(address) view returns (tuple(uint256, address, string, string, string, string, string, string, bool)[])",
    params: account ? [account.address] : undefined,
    queryOptions: { enabled: !!account }
  });

  const handleSuccess = () => {
      // Quando un'iscrizione ha successo, aggiorniamo i dati
      refetchContributorInfo();
      refetchBatches();
  };

  return (
    <div className="app-container-full">
      <header className="main-header-bar">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>EasyChain - Area Riservata</div>
        </Link>
        <div className="wallet-button-container">
          <ConnectButton client={client} chain={polygon} detailsModal={{ hideSend: true, hideReceive: true, hideBuy: true, hideTransactionHistory: true }} />
        </div>
      </header>

      {isModalOpen && <NuovaIscrizioneModal contributorInfo={contributorInfo} onClose={() => setIsModalOpen(false)} onSuccess={handleSuccess} />}

      <main className="main-content-full">
        {contributorInfo && <DashboardHeader contributorInfo={contributorInfo} />}
        
        <div style={{ padding: '1rem 0', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="web3-button" style={{ padding: '1rem 2rem' }} onClick={() => setIsModalOpen(true)}>
            + Nuova Iscrizione
          </button>
        </div>

        <div className="card-grid">
          {batches && batches.length > 0 ? (
            batches.map((batch, index) => (
              <BatchCard key={batch[0].toString()} batch={batch} batchId={Number(batch[0])} />
            )).reverse() // Mostra i più recenti per primi
          ) : (
            <p>Non hai ancora nessuna iscrizione attiva. Clicca su "Nuova Iscrizione" per iniziare.</p>
          )}
        </div>
      </main>
    </div>
  );
}