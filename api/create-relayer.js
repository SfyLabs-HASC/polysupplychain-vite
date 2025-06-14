// FILE: api/create-relayer.js
// VERSIONE DEFINITIVA: Ora include anche il Client ID nell'header, come richiesto da Engine.

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

    const engineUrl = process.env.THIRDWEB_ENGINE_URL;
    const adminKey = process.env.THIRDWEB_VAULT_ADMIN_KEY;
    const clientId = process.env.THIRDWEB_CLIENT_ID; // Leggiamo il nuovo Client ID

    if (!engineUrl || !adminKey || !clientId) {
        console.error("ERRORE: Una o più variabili d'ambiente di Engine (URL, ADMIN_KEY, CLIENT_ID) non sono configurate su Vercel.");
        throw new Error("Configurazione del server incompleta.");
    }
    
    const cleanedEngineUrl = engineUrl.replace(/\/$/, ""); 
    const fullEndpointUrl = `${cleanedEngineUrl}/backend-wallet/create`;

    // --- Chiamata API REALE a thirdweb Engine ---
    const engineResponse = await fetch(fullEndpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`, 
        // MODIFICA CHIAVE: Aggiungiamo il Client ID come richiesto dall'errore
        'x-client-id': clientId,
      },
      body: JSON.stringify({}),
    });

    const responseText = await engineResponse.text();
    if (!engineResponse.ok) {
        throw new Error(`Errore da Engine (${engineResponse.status}): ${responseText}`);
    }

    const newWalletData = JSON.parse(responseText);
    const newWalletAddress = newWalletData.result.walletAddress;

    if (!newWalletAddress) {
        throw new Error("Engine non ha restituito un indirizzo valido per il wallet.");
    }

    // --- Aggiorna il nostro database Firestore ---
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
