// FILE: src/pages/GestisciPage.tsx
// NUOVA PAGINA PER LA GESTIONE DI UN SINGOLO BATCH

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

const GestisciPageHeader = ({ contributorInfo }: { contributorInfo: any }) => {
    const companyName = contributorInfo ? contributorInfo[0] : 'Azienda';
    const credits = contributorInfo ? contributorInfo[1].toString() : '...';
    return (
        <div className="dashboard-header-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            <div>
                <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '3rem' }}>Ciao, {companyName}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div className="status-item"><span>Crediti Rimanenti: <strong>{credits}</strong></span></div>
                    <div className="status-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>Stato: <strong>ATTIVO</strong></span><span className="status-icon">✅</span></div>
                </div>
            </div>
        </div>
    );
};

const BatchSummaryCard = ({ batchInfo, stepCount, onAddStep, onFinalize }: { batchInfo: any, stepCount: number, onAddStep: () => void, onFinalize: () => void }) => {
    if (!batchInfo) return null;
    const imageUrl = batchInfo[7] && batchInfo[7] !== "N/A"
        ? `https://musical-emerald-partridge.myfilebase.com/ipfs/${batchInfo[7]}`
        : "https://musical-emerald-partridge.myfilebase.com/ipfs/QmNUGt9nxmkV27qF56jFAG9FUPABvGww5TTW9R9vh2TdvB";
    return (
        <div className="card" style={{ marginTop: '2rem', backgroundColor: '#8bc4a8' }}>
            <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ flex: '0 0 150px' }}>
                    <img src={imageUrl} alt="Immagine batch" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', aspectRatio: '1 / 1' }}/>
                </div>
                <div style={{ flex: '1' }}>
                    <h3>Riepilogo Iscrizione: {batchInfo[3]}</h3>
                    <p><strong>Descrizione:</strong> {batchInfo[4] || 'N/D'}</p>
                    <p><strong>Luogo:</strong> {batchInfo[6] || 'N/D'} | <strong>Data:</strong> {batchInfo[5] || 'N/D'}</p>
                    <p><strong>N° Passaggi:</strong> {stepCount} | <strong>Stato:</strong> {batchInfo[8] ? <span className="status-closed">Chiuso</span> : <span className="status-open">Aperto</span>}</p>
                    {!batchInfo[8] && (
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                            <button className="web3-button" onClick={onAddStep}>Aggiungi Passaggio</button>
                            <button className="web3-button secondary" onClick={onFinalize}>Finalizza Iscrizione</button>
                        </div>
                    )}
                </div>
            </div>
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
        {stepInfo[4] && stepInfo[4] !== "N/A" && (
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
                {isLoading ? <p style={{textAlign: 'center', marginTop: '2rem'}}>Caricamento dati iscrizione...</p> : 
                    <>
                        <BatchSummaryCard batchInfo={batchInfo} stepCount={steps.length} onAddStep={handleAddStepClick} onFinalize={handleFinalize} />
                        <div style={{marginTop: '2rem'}}>
                            <h4>Passaggi dell'Iscrizione</h4>
                            {steps.length === 0 ? (
                                <div className="card">
                                    <p>Nessun Passaggio aggiunto a questa iscrizione.</p>
                                    {batchInfo && !batchInfo[8] && <p>Aggiungi nuovi passaggi o Finalizza l'iscrizione.</p>}
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