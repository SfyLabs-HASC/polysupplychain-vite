// FILE: src/pages/GestisciPage.tsx
// (CODICE CON HEADER CORRETTO COME DA SCREENSHOT)

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall, readContract } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { supplyChainABI as abi } from '../abi/contractABI';
import '../App.css';
import TransactionStatusModal from '../components/TransactionStatusModal';

const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ 
  client, 
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});

// MODIFICA: Header ora include il pulsante sulla destra, come nello screenshot
const GestisciPageHeader = ({ contributorInfo }: { contributorInfo: any }) => {
    const companyName = contributorInfo ? contributorInfo[0] : 'Azienda';
    const credits = contributorInfo ? contributorInfo[1].toString() : '...';
    return (
        <div className="dashboard-header-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Sezione sinistra con nome e crediti */}
            <div>
                <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '3rem' }}>{companyName}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div className="status-item"><span>Crediti Rimanenti: <strong>{credits}</strong></span></div>
                    <div className="status-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>Stato: <strong>ATTIVO</strong></span><span className="status-icon">✅</span></div>
                </div>
            </div>
            {/* Sezione destra con il pulsante */}
            <div>
                <Link to="/">
                    <button style={{
                        backgroundColor: '#6A5ACD', // Viola
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: 'bold'
                    }}>
                        ← Torna alla Pagina Principale
                    </button>
                </Link>
            </div>
        </div>
    );
};

const ImagePlaceholder = () => (
    <div style={{
        width: '150px', height: '150px', flexShrink: 0,
        backgroundColor: '#f0f0f0', border: '1px solid #ddd', borderRadius: '8px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        color: '#a0a0a0', textAlign: 'center'
    }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
            <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
            <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
        </svg>
        <div style={{fontSize: '0.8rem', marginTop: '5px', fontWeight: 'bold'}}>NO IMAGE<br/>AVAILABLE</div>
    </div>
);

const BatchSummaryCard = ({ batchInfo, stepCount, onAddStep, onFinalize }: { batchInfo: any, stepCount: number, onAddStep: () => void, onFinalize: () => void }) => {
    if (!batchInfo) return null;
    
    const defaultImageUrl = "https://musical-emerald-partridge.myfilebase.com/ipfs/QmNUGt9nxmkV27qF56jFAG9FUPABvGww5TTW9R9vh2TdvB";
    const imageUrl = batchInfo[7] && batchInfo[7] !== "N/A" ? `https://musical-emerald-partridge.myfilebase.com/ipfs/${batchInfo[7]}` : defaultImageUrl;
    const isPlaceholder = imageUrl === defaultImageUrl;
    const isClosed = batchInfo[8];

    return (
        <div className="card" style={{ 
            marginTop: '1rem', 
            backgroundColor: 'transparent', 
            border: '1px solid #8bc4a8', 
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '2rem'
        }}>
            {isPlaceholder ? <ImagePlaceholder /> : (
                 <img src={imageUrl} alt="Immagine batch" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}/>
            )}
            <div style={{ flex: '1 1 40%', minWidth: 0 }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '1.75rem', margin: '0 0 0.5rem 0', color: 'white' }}>{batchInfo[3]}</h3>
                <p style={{ margin: 0, color: '#ced4da', fontSize: '0.95rem' }}>{batchInfo[4] || 'Nessuna descrizione fornita.'}</p>
            </div>
            <div style={{ flex: '1 1 25%', color: '#ced4da', textAlign: 'left' }}>
                <p style={{margin: '0.3rem 0'}}><strong>Stato Iscrizione:</strong> <span style={{color: isClosed ? '#dc3545' : '#28a745', fontWeight:'bold'}}>{isClosed ? 'Chiuso' : 'Aperto'}</span></p>
                <p style={{margin: '0.3rem 0'}}><strong>Luogo:</strong> {batchInfo[6] || 'N/D'}</p>
                <p style={{margin: '0.3rem 0'}}><strong>Data:</strong> {batchInfo[5] || 'N/D'}</p>
                <p style={{margin: '0.3rem 0'}}><strong>Passaggi Registrati:</strong> {stepCount}</p>
            </div>
            {!isClosed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button onClick={onAddStep} style={{
                        backgroundColor: '#6A5ACD', color: 'white', border: 'none',
                        padding: '12px 24px', borderRadius: '8px', cursor: 'pointer',
                        fontSize: '1rem', fontWeight: 'bold', width: '200px'
                    }}>Aggiungi Passaggio</button>
                    <button onClick={onFinalize} style={{
                        backgroundColor: '#495057', color: '#ced4da', border: 'none',
                        padding: '12px 24px', borderRadius: '8px', cursor: 'pointer',
                        fontSize: '1rem', fontWeight: 'bold', width: '200px'
                    }}>Finalizza Iscrizione</button>
                </div>
            )}
        </div>
    );
};

const StepCard = ({ stepInfo }: { stepInfo: any }) => (
    <div className="card" style={{backgroundColor: '#343a40', color: '#f8f9fa', marginTop: '1rem'}}>
        <h4>{stepInfo[0]}</h4>
        <p>{stepInfo[1]}</p>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#adb5bd'}}>
            <span>Luogo: {stepInfo[3]}</span>
            <span>Data: {stepInfo[2]}</span>
        </div>
        {stepInfo[4] && stepInfo[4] !== "n/A" && (
             <a href={`https://musical-emerald-partridge.myfilebase.com/ipfs/${stepInfo[4]}`} target="_blank" rel="noopener noreferrer" className="link-button" style={{marginTop: '1rem'}}>
                 Vedi Documento Allegato
             </a>
        )}
    </div>
);

export default function GestisciPage() {
    const { batchId } = useParams<{ batchId: string }>();
    const account = useActiveAccount();
    const { data: contributorInfo } = useReadContract({ contract, method: "function getContributorInfo(address) view returns (string, uint256, bool)", params: account ? [account.address] : undefined, queryOptions: { enabled: !!account } });

    const [batchInfo, setBatchInfo] = useState<any>(null);
    const [steps, setSteps] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { mutate: sendTransaction, isPending } = useSendTransaction();
    const [txResult, setTxResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

    const fetchBatchData = async () => {
        if (!batchId) return;
        setIsLoading(true);
        try {
            const id = BigInt(batchId);
            const info = await readContract({ contract, abi, method: "function getBatchInfo(uint256) view returns (uint256,address,string,string,string,string,string,string,bool)", params: [id] });
            setBatchInfo(info);
            const stepCount = await readContract({ contract, abi, method: "function getBatchStepCount(uint256) view returns (uint256)", params: [id] }) as bigint;
            const stepsPromises = [];
            for (let i = 0; i < stepCount; i++) {
                stepsPromises.push(readContract({ contract, abi, method: "function getStepDetails(uint256, uint256) view returns (string, string, string, string, string)", params: [id, BigInt(i)] }));
            }
            const stepsDetails = await Promise.all(stepsPromises);
            setSteps(stepsDetails);
        } catch (error) { console.error("Errore nel caricare i dati del batch:", error); } 
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchBatchData(); }, [batchId]);

    const handleFinalize = () => {
        if (!batchId || !confirm("Sei sicuro di voler finalizzare questa iscrizione? L'azione è irreversibile.")) return;
        const transaction = prepareContractCall({ contract, abi, method: "function closeBatch(uint256 _batchId)", params: [BigInt(batchId)] });
        sendTransaction(transaction, {
            onSuccess: () => { setTxResult({ status: 'success', message: 'Iscrizione finalizzata con successo!' }); fetchBatchData(); },
            onError: (err) => setTxResult({ status: 'error', message: `Errore: ${err.message}` })
        });
    };
    
    const handleAddStepClick = () => { alert("Qui si aprirà il modal per aggiungere un nuovo passaggio."); };

    return (
        <div className="app-container-full" style={{ padding: '0 2rem' }}>
            <header className="main-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>EasyChain - Area Riservata</div>
                </Link>
                <div className="wallet-button-container"><ConnectButton client={client} chain={polygon} detailsModal={{ hideSend: true, hideReceive: true, hideBuy: true, hideTransactionHistory: true }}/></div>
            </header>
            
            <main className="main-content-full">
                {contributorInfo && <GestisciPageHeader contributorInfo={contributorInfo} />}
                
                {/* MODIFICA: Il pulsante "Torna alla pagina principale" è stato spostato dentro GestisciPageHeader, quindi questo blocco non serve più */}

                {isLoading ? <p style={{textAlign: 'center', marginTop: '2rem'}}>Caricamento dati iscrizione...</p> : 
                    <>
                        <BatchSummaryCard batchInfo={batchInfo} stepCount={steps.length} onAddStep={handleAddStepClick} onFinalize={handleFinalize} />
                        
                        <div style={{marginTop: '2rem'}}>
                            {steps.length === 0 ? (
                                <div style={{textAlign: 'center', padding: '2rem', color: '#adb5bd'}}>
                                    <span style={{fontSize: '3rem', color: '#dc3545', fontWeight: 'bold', lineHeight: '1'}}>×</span>
                                    <p>Nessun Passaggio aggiunto a questa iscrizione.</p>
                                </div>
                            ) : (
                                steps.map((step, index) => <StepCard key={index} stepInfo={step} />)
                            )}
                        </div>
                    </>
                }
            </main>
            {(isPending || txResult) && (
                <TransactionStatusModal status={isPending ? 'loading' : txResult!.status} message={isPending ? 'Transazione in corso...' : txResult!.message} onClose={() => setTxResult(null)} />
            )}
        </div>
    );
}