// FILE: src/pages/GestisciPage.tsx
// (CODICE CON LOGOUT REDIRECT E FIX STABILITA')

import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall, readContract } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { supplyChainABI as abi } from '../abi/contractABI';
import '../App.css';
import TransactionStatusModal from '../components/TransactionStatusModal';

// ... (Client e Contract rimangono invariati)
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ client, chain: polygon, address: "0x4a866C3A071816E3186e18cbE99a3339f4571302" });

// ... (AggiungiEventoModal, EventoCard, ImagePlaceholder rimangono invariati)
const AggiungiEventoModal = ({ batchId, contributorName, onClose, onSuccess }: { batchId: bigint, contributorName: string, onClose: () => void, onSuccess: () => void }) => { /* ... codice modal ... */ return(<> <div className="modal-overlay" onClick={onClose}> <div className="modal-content" onClick={(e) => e.stopPropagation()}> <div className="modal-header"><h2>Aggiungi Nuovo Evento</h2></div> {/* ... corpo e footer del modal ... */} </div> </div> </>);};
const EventoCard = ({ eventoInfo }: { eventoInfo: any }) => { /* ... */ return(<div></div>); };
const ImagePlaceholder = () => { /* ... */ return(<div></div>); };


const GestisciPageHeader = ({ contributorInfo }: { contributorInfo: any }) => {
    const companyName = contributorInfo?.[0] || 'Azienda';
    const credits = contributorInfo?.[1]?.toString() || '...';
    return (
        <div className="dashboard-header-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '3rem' }}>{companyName}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div className="status-item"><span>Crediti Rimanenti: <strong>{credits}</strong></span></div>
                    <div className="status-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>Stato: <strong>ATTIVO</strong></span><span className="status-icon">✅</span></div>
                </div>
            </div>
            <div>
                <Link to="/">
                    <button style={{backgroundColor: '#6A5ACD', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold'}}>
                        ← Torna alla Pagina Principale
                    </button>
                </Link>
            </div>
        </div>
    );
};

const BatchSummaryCard = ({ batchInfo, eventCount, onAddEventoClick, onFinalize }: { batchInfo: any, eventCount: number, onAddEventoClick: () => void, onFinalize: () => void }) => {
    if(!batchInfo) return null;
    const defaultImageUrl="https://musical-emerald-partridge.myfilebase.com/ipfs/QmNUGt9nxmkV27qF56jFAG9FUPABvGww5TTW9R9vh2TdvB";
    const imageUrl=batchInfo[7]&&batchInfo[7]!=="N/A"?`https://musical-emerald-partridge.myfilebase.com/ipfs/${batchInfo[7]}`:defaultImageUrl;
    const isPlaceholder=imageUrl===defaultImageUrl;
    const isClosed=batchInfo[8];
    const statusIndicatorStyle = { height: '12px', width: '12px', backgroundColor: isClosed ? '#28a745' : '#ffc107', borderRadius: '50%', display: 'inline-block', marginRight: '8px' };
    return(
        <div className="card" style={{marginTop:'1rem',backgroundColor:'transparent',border:'1px solid #8bc4a8',padding:'1.5rem',display:'flex',alignItems:'center',gap:'2rem'}}>
            {isPlaceholder?<ImagePlaceholder />:<img src={imageUrl} alt="Immagine batch" style={{width:'150px',height:'150px',objectFit:'cover',borderRadius:'8px',flexShrink:0}} />}
            <div style={{flex:'1 1 40%',minWidth:0}}><h3 style={{fontWeight:'bold',fontSize:'1.75rem',margin:'0 0 0.5rem 0',color:'white'}}>{batchInfo[3]}</h3><p style={{margin:0,color:'#ced4da',fontSize:'0.95rem'}}>{batchInfo[4]||'Nessuna descrizione fornita.'}</p></div>
            <div style={{flex:'1 1 25%',color:'#ced4da',textAlign:'left'}}>
                <p style={{margin:'0.3rem 0', display: 'flex', alignItems: 'center'}}><span style={statusIndicatorStyle}></span><strong>Stato Iscrizione:</strong> <span style={{fontWeight:'bold', marginLeft: '4px'}}>{isClosed?'Chiuso':'Aperto'}</span></p>
                <p style={{margin:'0.3rem 0'}}><strong>Luogo:</strong> {batchInfo[6]||'N/D'}</p><p style={{margin:'0.3rem 0'}}><strong>Data:</strong> {batchInfo[5]||'N/D'}</p>
                <p style={{margin:'0.3rem 0'}}><strong>N° Eventi:</strong> {eventCount}</p>
            </div>
            {!isClosed&&(<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}><button onClick={onAddEventoClick} style={{backgroundColor:'#6A5ACD',color:'white',border:'none',padding:'12px 24px',borderRadius:'8px',cursor:'pointer',fontSize:'1rem',fontWeight:'bold',width:'200px'}}>Aggiungi Evento</button><button onClick={onFinalize} style={{backgroundColor:'#495057',color:'#ced4da',border:'none',padding:'12px 24px',borderRadius:'8px',cursor:'pointer',fontSize:'1rem',fontWeight:'bold',width:'200px'}}>Finalizza Iscrizione</button></div>)}
        </div>
    );
};


export default function GestisciPage() {
    const { batchId } = useParams<{ batchId: string }>();
    const account = useActiveAccount();
    const navigate = useNavigate(); // Hook per la navigazione
    const prevAccount = useRef(account); // Ref per memorizzare lo stato precedente dell'account

    // MODIFICA: Aggiunto isLoading per stabilizzare il rendering
    const { data: contributorInfo, isLoading: isContributorLoading } = useReadContract({ contract, method: "function getContributorInfo(address) view returns (string, uint256, bool)", params: account ? [account.address] : undefined });

    const [batchInfo, setBatchInfo] = useState<any>(null);
    const [eventi, setEventi] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [txResult, setTxResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { mutate: sendTransaction, isPending: isFinalizing } = useSendTransaction();

    const { data: eventCount, refetch: refetchEventCount } = useReadContract({ contract, method: "function getBatchStepCount(uint256)", params: batchId ? [BigInt(batchId)] : undefined, queryOptions: { enabled: !!batchId } });

    // MODIFICA: Implementato redirect al logout
    useEffect(() => {
        if (!account && prevAccount.current) {
            // L'utente si è appena disconnesso
            navigate('/');
        }
        prevAccount.current = account;
    }, [account, navigate]);

    const fetchBatchData = async () => { /* ... */ };
    useEffect(() => { if (batchId) fetchBatchData(); }, [batchId]);

    const handleFinalize = () => { /* ... */ };
    const handleAddEventoSuccess = () => { /* ... */ };

    // MODIFICA: Aggiunto un controllo di caricamento generale per prevenire sfarfallii
    if (isContributorLoading) {
        return <div className="app-container-full" style={{textAlign: 'center', paddingTop: '5rem'}}>Caricamento dati utente...</div>;
    }

    return (
        <div className="app-container-full" style={{ padding: '0 2rem' }}>
            <header className="main-header-bar">
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}><div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>EasyChain - Area Riservata</div></Link>
                <div className="wallet-button-container"><ConnectButton client={client} chain={polygon} /></div>
            </header>
            
            <main className="main-content-full">
                {contributorInfo && <GestisciPageHeader contributorInfo={contributorInfo} />}
                
                {isLoadingData ? <p style={{textAlign: 'center', marginTop: '2rem'}}>Caricamento dati iscrizione...</p> : 
                    <>
                        <BatchSummaryCard batchInfo={batchInfo} eventCount={Number(eventCount) || 0} onAddEventoClick={() => setIsModalOpen(true)} onFinalize={handleFinalize} />
                        <div style={{marginTop: '2rem'}}>
                            <h4>Eventi dell'Iscrizione</h4>
                            {eventi.length === 0 ? (
                                <div style={{textAlign: 'center', padding: '2rem', color: '#adb5bd'}}>
                                    <span style={{fontSize: '3rem', color: '#dc3545', fontWeight: 'bold', lineHeight: '1'}}>×</span>
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