// FILE: api/create-relayer.js
// VERSIONE FINALE E ROBUSTA: Migliorata la gestione dell'URL e aggiunto il logging per il debug.

import admin from 'firebase-admin';

// Funzione di inizializzazione di Firebase
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } catch (error) { console.error('Firebase init error', error.stack); }
  }
  return admin.firestore();
}
const db = initializeFirebaseAdmin();

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { companyId, companyStatus } = req.body;
    if (!companyId) {
      return res.status(400).json({ error: "ID Azienda mancante." });
    }

    // --- 1. Controllo e Pulizia delle Variabili d'Ambiente ---
    const engineUrl = process.env.THIRDWEB_ENGINE_URL;
    const secretKey = process.env.THIRDWEB_SECRET_KEY;
    const accessToken = process.env.THIRDWEB_VAULT_ACCESS_TOKEN;

    if (!engineUrl || !secretKey || !accessToken) {
        console.error("ERRORE: Una o più variabili d'ambiente di Engine non sono configurate su Vercel.");
        throw new Error("Configurazione del server incompleta.");
    }
    
    // Puliamo l'URL per evitare errori di battitura (es. doppie barre)
    const cleanedEngineUrl = engineUrl.replace(/\/$/, ""); // Rimuove la barra finale se presente
    const fullEndpointUrl = `${cleanedEngineUrl}/backend-wallet/create`;
    
    // --- 2. Preparazione della Chiamata API REALE a thirdweb Engine ---
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secretKey}`,
      'x-thirdweb-access-token': accessToken,
    };

    // LOG DI DEBUG: Stampiamo l'URL e le intestazioni (senza la chiave) per verificare
    console.log(`DEBUG: Chiamata a Engine...`);
    console.log(`DEBUG: Metodo: POST`);
    console.log(`DEBUG: URL: ${fullEndpointUrl}`);
    console.log(`DEBUG: Headers presenti: ${Object.keys(headers).join(', ')}`);

    const engineResponse = await fetch(fullEndpointUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({}),
    });

    const responseText = await engineResponse.text();
    console.log(`DEBUG: Risposta testuale da Engine (Status: ${engineResponse.status}): ${responseText}`);

    if (!engineResponse.ok) {
        throw new Error(`Errore da Engine (${engineResponse.status}): ${responseText}`);
    }

    const newWalletData = JSON.parse(responseText);
    const newWalletAddress = newWalletData.result.walletAddress;

    if (!newWalletAddress) {
        throw new Error("Engine non ha restituito un indirizzo valido per il wallet.");
    }

    // --- 3. Aggiorna il nostro database Firestore ---
    const collectionName = companyStatus === 'pending' ? 'pendingCompanies' : 'activeCompanies';
    const companyRef = db.collection(collectionName).doc(companyId);
    
    await companyRef.update({
      relayerWalletAddress: newWalletAddress
    });

    res.status(200).json({ 
        message: `Wallet Relayer creato e assegnato con successo!`,
        relayerAddress: newWalletAddress 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Errore critico durante la creazione del relayer:", errorMessage);
    res.status(500).json({ error: errorMessage });
  }
};
