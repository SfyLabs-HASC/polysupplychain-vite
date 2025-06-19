// FILE: src/pages/HomePage.tsx
// Gestisce il benvenuto e il reindirizzamento post-login

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectButton, useActiveAccount, useReadContract } from 'thirdweb/react';
import { createThirdwebClient, getContract } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { supplyChainABI as abi } from '../abi/contractABI';

// Configura il client e il contratto (necessari anche qui)
const client = createThirdwebClient({ clientId: "e40dfd747fabedf48c5837fb79caf2eb" });
const contract = getContract({ 
  client, 
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302"
});

export default function HomePage() {
    const account = useActiveAccount();
    const navigate = useNavigate();

    // Controlliamo lo stato dell'utente non appena si collega
    const { data: contributorData, isLoading } = useReadContract({
        contract,
        method: "function getContributorInfo(address) view returns (string, uint256, bool)",
        params: account ? [account.address] : undefined,
        queryOptions: { enabled: !!account }
    });

    useEffect(() => {
        // Questo codice viene eseguito ogni volta che l'utente si collega o i suoi dati cambiano
        if (account && contributorData) {
            const isRegisteredAndActive = contributorData[2];

            if (isRegisteredAndActive) {
                // Se l'utente è un'azienda attiva, lo mandiamo alla sua dashboard
                console.log("Utente attivo, reindirizzamento a /dashboard...");
                navigate('/dashboard');
            }
        }
    }, [account, contributorData, navigate]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Benvenuto su EasyChain</h1>
            <p style={{ fontSize: '1.2rem', maxWidth: '600px', marginBottom: '2rem' }}>
                La soluzione per la tracciabilità della tua filiera. Connetti il tuo wallet per accedere alla tua area riservata o per iniziare una nuova registrazione.
            </p>
            
            <div style={{ border: '1px solid #ddd', padding: '2rem', borderRadius: '12px', background: '#f9f9f9' }}>
                <ConnectButton 
                    client={client} 
                    appMetadata={{
                        name: "EasyChain App",
                        url: window.location.origin,
                    }}
                />
                {account && isLoading && (
                    <p style={{ marginTop: '1rem', color: '#555' }}>Verifica dello stato dell'account in corso...</p>
                )}
                 {account && contributorData && !contributorData[2] && (
                    <p style={{ marginTop: '1rem', color: '#007bff' }}>Account connesso. Completa la registrazione per accedere alla dashboard.</p>
                )}
            </div>
        </div>
    );
}