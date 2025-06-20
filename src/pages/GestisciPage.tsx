// FILE: src/pages/GestisciPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall, readContract, defineChain } from 'thirdweb';
import { supplyChainABI as abi } from '../abi/contractABI';
import '../App.css';
import TransactionStatusModal from '../components/TransactionStatusModal';

const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });

// MODIFICA: Rete aggiornata a Moonbeam
const moonbeamChain = defineChain(1284);

const contract = getContract({ 
  client, 
  chain: moonbeamChain,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});


const EventoCard = ({ eventoInfo }: { eventoInfo: any }) => { /* ... */ };
const AggiungiEventoModal = ({ batchId, contributorName, onClose, onSuccess }: { /* ... */ }) => { /* ... */ };
const GestisciPageHeader = ({ contributorInfo }: { contributorInfo: any }) => { /* ... */ };
const ImagePlaceholder = () => { /* ... */ };
const BatchSummaryCard = ({ batchInfo, eventCount, onAddEventoClick, onFinalize }: { /* ... */ }) => { /* ... */ };


export default function GestisciPage() {
    const { batchId } = useParams<{ batchId: string }>();
    const account = useActiveAccount();
    const { data: contributorInfo } = useReadContract({ contract, method: "function getContributorInfo(address) view returns (string, uint256, bool)", params: account ? [account.address] : undefined });

    const [batchInfo, setBatchInfo] = useState<any>(null);
    const [eventi, setEventi] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { mutate: sendTransaction, isPending: isFinalizing } = useSendTransaction();
    const [txResult, setTxResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: eventCount, refetch: refetchEventCount } = useReadContract({
        contract,
        method: "function getBatchStepCount(uint256)",
        params: batchId ? [BigInt(batchId)] : undefined,
        queryOptions: { enabled: !!batchId }
    });

    const fetchBatchData = async () => {
        if (!batchId) return;
        setIsLoading(true);
        try {
            const id = BigInt(batchId);
            const info = await readContract({ contract, abi, method: "function getBatchInfo(uint256) view returns (uint256,address,string,string,string,string,string,string,bool)", params: [id] });
            setBatchInfo(info);
            
            const count = await readContract({ contract, abi, method: "function getBatchStepCount(uint256) view returns (uint256)", params: [id] }) as bigint;
            const stepsPromises = Array.from({ length: Number(count) }, (_, i) => 
                readContract({ contract, abi, method: "function getStepDetails(uint256, uint256) view returns (string, string, string, string, string)", params: [id, BigInt(i)] })
            );
            const stepsDetails = await Promise.all(stepsPromises);
            setEventi(stepsDetails.reverse());
        } catch (error) { console.error("Errore nel caricare i dati del batch:", error); } 
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchBatchData(); }, [batchId]);
    
    const handleFinalize = () => {
        const confirmationMessage = "Sei sicuro di voler finalizzare questa iscrizione? L'operazione non è reversibile.";
        if (!batchId || !window.confirm(confirmationMessage)) return;
        
        const transaction = prepareContractCall({ contract, abi, method: "function closeBatch(uint256 _batchId)", params: [BigInt(batchId)] });
        sendTransaction(transaction, {
            onSuccess: () => { setTxResult({ status: 'success', message: 'Iscrizione finalizzata con successo!' }); fetchBatchData(); },
            // CORREZIONE BUILD: Aggiunta la '}' mancante
            onError: (err) => { setTxResult({ status: 'error', message: `Errore: ${err.message}` }); }
        });
    };
    
    const handleAddEventoSuccess = () => {
        setTxResult({ status: 'success', message: 'Evento aggiunto con successo!' });
        setIsModalOpen(false);
        fetchBatchData();
        refetchEventCount();
    };

    return (
        <div className="app-container-full" style={{ padding: '0 2rem' }}>
            <header className="main-header-bar">
                <Link to="/azienda" style={{ textDecoration: 'none', color: 'inherit' }}><div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>EasyChain</div></Link>
                <div className="wallet-button-container">
                    <ConnectButton client={client} chain={moonbeamChain} detailsModal={{ hideSend: true, hideReceive: true, hideBuy: true, hideTransactionHistory: true }}/>
                </div>
            </header>
            
            <main className="main-content-full">
                {contributorInfo && <GestisciPageHeader contributorInfo={contributorInfo} />}
                
                {isLoading ? <p style={{textAlign: 'center', marginTop: '2rem'}}>Caricamento dati iscrizione...</p> : 
                    <>
                        <BatchSummaryCard batchInfo={batchInfo} eventCount={Number(eventCount) || 0} onAddEventoClick={() => setIsModalOpen(true)} onFinalize={handleFinalize} />
                        
                        <div style={{marginTop: '2rem'}}>
                            <h4>Eventi dell'Iscrizione</h4>
                            {eventi.length === 0 ? (
                                <div style={{textAlign: 'center', padding: '2rem', color: '#adb5bd'}}>
                                    <p>Nessun Evento aggiunto a questa iscrizione.</p>
                                </div>
                            ) : (
                                eventi.map((evento, index) => <EventoCard key={index} eventoInfo={evento} />)
                            )}
                        </div>
                    </>
                }
            </main>

            {isModalOpen && batchId && (
                <AggiungiEventoModal 
                    batchId={BigInt(batchId)}
                    contributorName={contributorInfo?.[0] || 'AziendaGenerica'}
                    onClose={() => setIsModalOpen(false)} 
                    onSuccess={handleAddEventoSuccess} 
                />
            )}
            
            {isFinalizing && <TransactionStatusModal status="loading" message="Finalizzazione in corso..." onClose={() => {}}/>}
            {txResult && <TransactionStatusModal status={txResult.status} message={txResult.message} onClose={() => setTxResult(null)} />}
        </div>
    );
}