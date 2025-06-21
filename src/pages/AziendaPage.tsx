import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall, readContract } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { inAppWallet } from 'thirdweb/wallets';
import { supplyChainABI as abi } from '../abi/contractABI';
import '../App.css';
import TransactionStatusModal from '../components/TransactionStatusModal';

// --- CONFIGURAZIONE PER POLYGON CON SDK v5 ---
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });

const contract = getContract({
  client,
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});


// --- COMPONENTI UI (codice originale) ---
const AziendaPageStyles = () => ( <style>{`/* ... CSS originale ... */`}</style> );
const RegistrationForm = () => ( <div className="card"><h3>Benvenuto su Easy Chain!</h3><p>Il tuo account non è ancora attivo. Compila il form di registrazione per inviare una richiesta di attivazione.</p></div> );
interface BatchData { id: string; batchId: bigint; name: string; description: string; date: string; location: string; isClosed: boolean; }

const BatchRow = ({ batch, localId }: { batch: BatchData; localId: number }) => {
    const [showDescription, setShowDescription] = useState(false);
    const { data: stepCount } = useReadContract({ contract, abi, method: "function getBatchStepCount(uint256 _batchId) view returns (uint256)", params: [batch.batchId] });
    const formatDate = (dateStr: string | undefined) => !dateStr || dateStr.split('-').length !== 3 ? '/' : dateStr.split('-').reverse().join('/');
    // ... resto del tuo codice originale ...
};

const BatchTable = ({ batches, nameFilter, setNameFilter, locationFilter, setLocationFilter, statusFilter, setStatusFilter }: any) => {
    // ... il tuo codice originale ...
};

const DashboardHeader = ({ contributorInfo, onNewInscriptionClick }: { contributorInfo: readonly [string, bigint, boolean], onNewInscriptionClick: () => void }) => {
    // ... il tuo codice originale ...
};

const getInitialFormData = () => ({ name: "", description: "", date: "", location: "" });
const truncateText = (text: string, maxLength: number) => text.length > maxLength ? text.substring(0, maxLength) + "..." : text;


// --- COMPONENTE PRINCIPALE ---
export default function AziendaPage() {
    const account = useActiveAccount();
    const { data: contributorData, isLoading: isStatusLoading, refetch: refetchContributorInfo, isError } = useReadContract({ contract, method: "function getContributorInfo(address) view returns (string, uint256, bool)", params: account ? [account.address] : undefined, queryOptions: { enabled: !!account } });
    const prevAccountRef = useRef(account?.address);
    const { mutate: sendTransaction, isPending } = useSendTransaction();

    const [modal, setModal] = useState<'init' | null>(null);
    const [formData, setFormData] = useState(getInitialFormData());
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [txResult, setTxResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
    const [allBatches, setAllBatches] = useState<BatchData[]>([]);
    const [filteredBatches, setFilteredBatches] = useState<BatchData[]>([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const [nameFilter, setNameFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // AGGIUNTA: Stato per il contatore
    const [rpcCount, setRpcCount] = useState(0);

    const fetchAllBatches = async () => {
        if (!account?.address) return;
        setIsLoadingBatches(true);
        try {
            // AGGIUNTA: Incremento contatore
            setRpcCount(c => c + 1);
            const batchIds = await readContract({ contract, abi, method: "function getBatchesByContributor(address) view returns (uint256[])", params: [account.address] }) as bigint[];
            
            if (batchIds.length > 0) {
                // AGGIUNTA: Incremento contatore
                setRpcCount(c => c + batchIds.length);
                const batchDataPromises = batchIds.map(id => readContract({ contract, abi, method: "function getBatchInfo(uint256) view returns (uint256,address,string,string,string,string,string,string,bool)", params: [id] }).then(info => ({ id: id.toString(), batchId: id, name: info[3], description: info[4], date: info[5], location: info[6], isClosed: info[8] })));
                const results = await Promise.all(batchDataPromises);
                setAllBatches(results.sort((a, b) => Number(b.batchId) - Number(a.batchId)));
            } else {
                setAllBatches([]);
            }
        } catch (error) { console.error("Errore nel caricare i lotti:", error); setAllBatches([]); } 
        finally { setIsLoadingBatches(false); }
    };

    useEffect(() => {
        if (account?.address) {
            // AGGIUNTA: Incremento contatore (per refetchContributorInfo) e reset
            setRpcCount(1);
            refetchContributorInfo();
            fetchAllBatches();
        } else if (!account && prevAccountRef.current) {
            window.location.href = '/';
        }
        prevAccountRef.current = account?.address;
    }, [account]);

    useEffect(() => {
        let tempBatches = [...allBatches];
        if (nameFilter) tempBatches = tempBatches.filter(b => b.name.toLowerCase().includes(nameFilter.toLowerCase()));
        if (locationFilter) tempBatches = tempBatches.filter(b => b.location.toLowerCase().includes(locationFilter.toLowerCase()));
        if (statusFilter !== 'all') { const isOpen = statusFilter === 'open'; tempBatches = tempBatches.filter(b => !b.isClosed === isOpen); }
        setFilteredBatches(tempBatches);
    }, [nameFilter, locationFilter, statusFilter, allBatches]);
    
    const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setFormData(prev => ({...prev, [e.target.name]: e.target.value})); };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { setSelectedFile(e.target.files?.[0] || null); };
    
    const handleInitializeBatch = async () => {
        if (!formData.name.trim()) { setTxResult({ status: 'error', message: 'Il campo Nome è obbligatorio.' }); return; }
        setLoadingMessage('Preparazione transazione...');
        let imageIpfsHash = "N/A";
        if (selectedFile) {
            //... la tua logica di upload
        }
        setLoadingMessage('Transazione in corso...');
        // AGGIUNTA: Incremento contatore
        setRpcCount(c => c + 1);
        const transaction = prepareContractCall({ contract, abi, method: "function initializeBatch(string,string,string,string,string)", params: [formData.name, formData.description, formData.date, formData.location, imageIpfsHash] });
        sendTransaction(transaction, { 
            onSuccess: async () => { setTxResult({ status: 'success', message: 'Iscrizione creata con successo!' }); await Promise.all([fetchAllBatches(), refetchContributorInfo()]); setLoadingMessage(''); },
            onError: (err) => { setTxResult({ status: 'error', message: err.message.toLowerCase().includes("insufficient funds") ? "Crediti Insufficienti, Ricarica" : "Errore nella transazione." }); setLoadingMessage(''); } 
        });
    };
    
    const openModal = () => { setFormData(getInitialFormData()); setSelectedFile(null); setCurrentStep(1); setTxResult(null); setModal('init'); };
    const handleCloseModal = () => setModal(null);
    const handleNextStep = () => { if (currentStep === 1 && !formData.name.trim()) { alert("Il campo 'Nome Iscrizione' è obbligatorio."); return; } if (currentStep < 6) setCurrentStep(prev => prev + 1); };
    const handlePrevStep = () => { if (currentStep > 1) setCurrentStep(prev => prev - 1); };
    
    if (!account) {
        return (
            <div className='login-container'>
                <AziendaPageStyles />
                <ConnectButton
                    client={client}
                    chain={polygon}
                    accountAbstraction={{
                        chain: polygon,
                        sponsorGas: true,
                    }}
                    wallets={[inAppWallet()]}
                    connectButton={{ label: "Connettiti / Log In", style: { fontSize: '1.2rem', padding: '1rem 2rem' } }}
                />
            </div>
        );
    }
    
    const renderDashboardContent = () => { 
        if (isStatusLoading) return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica stato account...</p>; 
        if (isError || !contributorData) return <p style={{textAlign: 'center', marginTop: '4rem', color: 'red'}}>Errore nel recuperare i dati dell'account. Riprova.</p>
        if (!contributorData[2]) return <RegistrationForm />; 
        return (
            <> 
                <DashboardHeader contributorInfo={contributorData} onNewInscriptionClick={openModal} /> 
                {isLoadingBatches ? <p style={{textAlign: 'center', marginTop: '2rem'}}>Caricamento iscrizioni...</p> : <BatchTable batches={filteredBatches} nameFilter={nameFilter} setNameFilter={setNameFilter} locationFilter={locationFilter} setLocationFilter={setLocationFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter}/>} 
            </>
        ); 
    };
    
    const isProcessing = loadingMessage !== '' || isPending;
    const today = new Date().toISOString().split('T')[0];
    const helpTextStyle = { backgroundColor: '#343a40', border: '1px solid #495057', borderRadius: '8px', padding: '16px', marginTop: '16px', fontSize: '0.9rem', color: '#f8f9fa' };

    return (
        <div className="app-container-full">
            {/* AGGIUNTA: Visualizzazione contatore */}
            <div style={{
                position: 'fixed', top: '10px', left: '10px', backgroundColor: '#ffc107',
                color: '#212529', padding: '5px 10px', borderRadius: '5px',
                fontFamily: 'monospace', fontWeight: 'bold', zIndex: 9999, fontSize: '14px'
            }}>
                RPC Calls: {rpcCount}
            </div>
            
            <AziendaPageStyles />
            <header className="main-header-bar">
                <div className="header-title">EasyChain - Area Riservata</div>
                <div className="wallet-button-container">
                    <ConnectButton
                        client={client}
                        chain={polygon}
                        detailsModal={{ hideSend: true, hideReceive: true, hideBuy: true, hideTransactionHistory: true }}
                    />
                </div>
            </header>
            <main className="main-content-full">{renderDashboardContent()}</main>
            
            {modal === 'init' && ( 
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2>Nuova Iscrizione ({currentStep}/6)</h2></div>
                        <div className="modal-body" style={{ minHeight: '350px' }}>
                            {currentStep === 1 && ( <div> <div className="form-group"><label>Nome Iscrizione <span style={{color: 'red', fontWeight:'bold'}}>* Obbligatorio</span></label><input type="text" name="name" value={formData.name} onChange={handleModalInputChange} className="form-input" maxLength={100} /><small className="char-counter">{formData.name.length} / 100</small></div> <div style={helpTextStyle}><p><strong>ℹ️ Come scegliere il Nome Iscrizione</strong></p><p>Il Nome Iscrizione è un'etichetta descrittiva che ti aiuta a identificare in modo chiaro ciò che stai registrando on-chain. Ad esempio:</p><ul style={{textAlign: 'left', paddingLeft: '20px'}}><li>Il nome di un prodotto o varietà: <em>Pomodori San Marzano 2025</em></li><li>Il numero di lotto: <em>Lotto LT1025 – Olio EVO 3L</em></li><li>Il nome di un contratto: <em>Contratto fornitura COOP – Aprile 2025</em></li><li>Una certificazione o audit: <em>Certificazione Bio ICEA 2025</em></li><li>Un riferimento amministrativo: <em>Ordine n.778 – Cliente NordItalia</em></li></ul><p style={{marginTop: '1rem'}}><strong>📌 Consiglio:</strong> scegli un nome breve ma significativo, che ti aiuti a ritrovare facilmente l’iscrizione anche dopo mesi o anni.</p></div> </div> )}
                            {currentStep === 2 && ( <div> <div className="form-group"><label>Descrizione <span style={{color: '#6c757d'}}>Non obbligatorio</span></label><textarea name="description" value={formData.description} onChange={handleModalInputChange} className="form-input" rows={4} maxLength={500}></textarea><small className="char-counter">{formData.description.length} / 500</small></div> <div style={helpTextStyle}><p>Inserisci una descrizione del prodotto, lotto, contratto o altro elemento principale. Fornisci tutte le informazioni essenziali per identificarlo chiaramente nella filiera o nel contesto dell’iscrizione.</p></div> </div> )}
                            {currentStep === 3 && ( <div> <div className="form-group"><label>Luogo <span style={{color: '#6c757d'}}>Non obbligatorio</span></label><input type="text" name="location" value={formData.location} onChange={handleModalInputChange} className="form-input" maxLength={100} /><small className="char-counter">{formData.location.length} / 100</small></div> <div style={helpTextStyle}><p>Inserisci il luogo di origine o di produzione del prodotto o lotto. Può essere una città, una regione, un'azienda agricola o uno stabilimento specifico per identificare con precisione dove è stato realizzato.</p></div> </div> )}
                            {currentStep === 4 && ( <div> <div className="form-group"><label>Data <span style={{color: '#6c757d'}}>Non obbligatorio</span></label><input type="date" name="date" value={formData.date} onChange={handleModalInputChange} className="form-input" max={today} /></div> <div style={helpTextStyle}><p>Inserisci una data, puoi utilizzare il giorno attuale o una data precedente alla conferma di questa Iscrizione.</p></div> </div> )}
                            {currentStep === 5 && ( <div> <div className="form-group"><label>Immagine <span style={{color: '#6c757d'}}>Non obbligatorio</span></label><input type="file" name="image" onChange={handleFileChange} className="form-input" accept="image/png, image/jpeg, image/webp"/><small style={{marginTop: '4px'}}>Formati: PNG, JPG, WEBP. Max: 5 MB.</small>{selectedFile && <p className="file-name-preview">File: {selectedFile.name}</p>}</div> <div style={helpTextStyle}><p>Carica un’immagine rappresentativa del prodotto, lotto, contratto, etc. Rispetta i formati e i limiti di peso.</p><p style={{marginTop: '10px'}}><strong>Consiglio:</strong> Per una visualizzazione ottimale, usa un'immagine quadrata (formato 1:1).</p></div> </div> )}
                             {currentStep === 6 && ( <div> <h4>Riepilogo Dati</h4> <div className="recap-summary"> <p><strong>Nome:</strong> {truncateText(formData.name, 40) || 'Non specificato'}</p> <p><strong>Descrizione:</strong> {truncateText(formData.description, 60) || 'Non specificata'}</p> <p><strong>Luogo:</strong> {truncateText(formData.location, 40) || 'Non specificato'}</p> <p><strong>Data:</strong> {formData.date ? formData.date.split('-').reverse().join('/') : 'Non specificata'}</p> <p><strong>Immagine:</strong> {selectedFile ? truncateText(selectedFile.name, 40) : 'Nessuna'}</p> </div> <p>Vuoi confermare e registrare questi dati sulla blockchain?</p> </div> )}
                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                            <div>{currentStep > 1 && <button onClick={handlePrevStep} className="web3-button secondary" disabled={isProcessing}>Indietro</button>}</div>
                            <div>
                                <button onClick={handleCloseModal} className="web3-button secondary" disabled={isProcessing}>Chiudi</button>
                                {currentStep < 6 && <button onClick={handleNextStep} className="web3-button">Avanti</button>}
                                {currentStep === 6 && <button onClick={handleInitializeBatch} disabled={isProcessing} className="web3-button">{isProcessing ? "Conferma..." : "Conferma e Registra"}</button>}
                            </div>
                        </div>
                    </div>
                </div> 
            )}
            
            {isProcessing && <TransactionStatusModal status={'loading'} message={loadingMessage} onClose={() => {}} />}
            {txResult && <TransactionStatusModal status={txResult.status} message={txResult.message} onClose={() => { if (txResult.status === 'success') handleCloseModal(); setTxResult(null); }} />}
        </div>
    );
}