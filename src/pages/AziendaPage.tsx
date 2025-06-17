// FILE: src/pages/AziendaPage.tsx
// VERSIONE FINALE CON FLUSSO DI AUTENTICAZIONE COMPLETO

import React, { useState, useEffect, useMemo } from 'react';
import { ConnectButton, useActiveAccount, useReadContract, useSendTransaction } from 'thirdweb/react';
import { createThirdwebClient, getContract, prepareContractCall, parseEventLogs, readContract } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { inAppWallet } from 'thirdweb/wallets';

// Importa l'ABI dal percorso corretto
import { supplyChainABI as abi } from '../abi/contractABI';
// Importa la configurazione di Firebase e le funzioni di autenticazione
import { db } from '../firebaseConfig';
import { getAuth, signInWithCustomToken, onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
// Importa il CSS dal percorso corretto
import '../App.css'; 

// --- Configurazione Centralizzata Thirdweb ---
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ 
  client, 
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});


// ==================================================================
// DEFINIZIONE DI TUTTI I COMPONENTI HELPER
// ==================================================================
// NOTA: Il codice dei componenti interni (BatchRow, BatchTable, ActiveUserDashboard, etc.)
// rimane invariato rispetto all'ultima versione e sono inclusi qui per completezza.

const RegistrationForm = () => { /* ... codice invariato ... */ return <div>Form di Registrazione</div>; };
const BatchRow = ({ metadata }: { metadata: BatchMetadata & { localId: number } }) => { /* ... codice invariato ... */ };
interface BatchMetadata { id: string; batchId: bigint; name: string; date: string; location: string; isClosed: boolean; ownerAddress: string; }
const BatchTable = () => { /* ... codice invariato ... */ };
const ActiveUserDashboard = () => { /* ... codice invariato ... */ };


// ==================================================================
// COMPONENTE PRINCIPALE EXPORTATO CON LOGICA DI AUTENTICAZIONE
// ==================================================================
export default function AziendaPage() {
    const account = useActiveAccount();
    
    // Stato per l'utente Firebase e il processo di login
    const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
    const [isSigningIn, setIsSigningIn] = useState(false);
    
    const { data: contributorData, isLoading: isStatusLoading } = useReadContract({
        contract,
        method: "function getContributorInfo(address _contributorAddress) view returns (string, uint256, bool)",
        params: account ? [account.address] : undefined,
        queryOptions: { enabled: !!account }
    });

    const isActive = contributorData ? contributorData[2] : false;
    const credits = contributorData ? contributorData[1].toString() : "N/A";

    // Effetto per gestire il flusso di login a Firebase
    useEffect(() => {
        const auth = getAuth();
        
        // Se un wallet è connesso, ma non siamo ancora loggati a Firebase
        if (account && !firebaseUser && !isSigningIn) {
            
            const signInToFirebase = async () => {
                setIsSigningIn(true);
                try {
                    // 1. Prepara il messaggio da firmare
                    const messageToSign = `Sto facendo il login a EasyChain con il mio wallet: ${account.address}`;
                    
                    // 2. Chiedi all'utente di firmare il messaggio con il suo wallet
                    const signature = await account.signMessage({ message: messageToSign });
                    
                    // 3. Chiama la nostra funzione backend sicura su Vercel
                    const response = await fetch('/api/auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ address: account.address, signature }),
                    });
                    
                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.error || 'Autenticazione al backend fallita.');
                    }
                    
                    // 4. Usa il token ricevuto per fare login su Firebase
                    await signInWithCustomToken(auth, data.token);
                    // Il listener onAuthStateChanged si occuperà di impostare firebaseUser

                } catch (error) {
                    console.error("Errore durante il processo di login a Firebase:", error);
                    alert("Non è stato possibile completare l'autenticazione. Riprova a connettere il wallet.");
                } finally {
                    setIsSigningIn(false);
                }
            };
            
            signInToFirebase();
        }
    }, [account, firebaseUser, isSigningIn]);

    // Listener per lo stato di autenticazione di Firebase
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
        });
        // Pulisci il listener quando il componente viene smontato
        return () => unsubscribe();
    }, []);


    const renderContent = () => {
        if (!account) {
            return <p style={{textAlign: 'center', marginTop: '4rem'}}>Connettiti per iniziare.</p>;
        }
        if (isStatusLoading) {
            return <p style={{textAlign: 'center', marginTop: '4rem'}}>Verifica stato contributor...</p>;
        }
        if (!isActive) {
            return <RegistrationForm />;
        }
        // Se l'utente è un contributor attivo, gestiamo il login a Firebase
        if (isSigningIn) {
            return <p style={{textAlign: 'center', marginTop: '4rem'}}>Autenticazione in corso... Firma il messaggio nel tuo wallet per continuare.</p>;
        }
        if (!firebaseUser) {
            return <p style={{textAlign: 'center', marginTop: '4rem'}}>Autenticazione a Firebase necessaria. Riconnetti il wallet o ricarica la pagina.</p>;
        }
        // Se tutto è andato a buon fine, mostra la dashboard
        return <ActiveUserDashboard />;
    };

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-header"><h1 className="sidebar-title">Easy Chain</h1></div>
                {account && (
                    <div className="user-info">
                        <p><strong>Wallet Connesso:</strong></p><p style={{wordBreak: 'break-all'}}>{account.address}</p>
                        <hr style={{ borderColor: '#27272a', margin: '1rem 0' }}/>
                        <p><strong>Crediti Rimanenti:</strong></p><p>{isStatusLoading ? "..." : credits}</p>
                    </div>
                )}
            </aside>
            <main className="main-content">
                <header className="header">
                    <ConnectButton 
                        client={client} 
                        chain={polygon} 
                        accountAbstraction={{ 
                            chain: polygon, 
                            sponsorGas: true,
                        }} 
                        wallets={[inAppWallet()]} 
                    />
                </header>
                <h2 className="page-title">Portale Aziende - I Miei Lotti</h2>
                {renderContent()}
            </main>
        </div>
    );
}

// NOTA: Ho omesso il corpo dei componenti interni come BatchRow, BatchTable,
// ActiveUserDashboard, e RegistrationForm per brevità, ma devono essere presenti
// nel tuo file perché il codice qui sopra li utilizza.
