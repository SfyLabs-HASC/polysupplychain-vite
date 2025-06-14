// FILE: api/create-relayer.js
// Questo endpoint crea un wallet backend dedicato tramite thirdweb Engine.

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

    if (!process.env.THIRDWEB_ENGINE_URL || !process.env.THIRDWEB_SECRET_KEY) {
        throw new Error("Configurazione di Engine non trovata sul server.");
    }
    
    // --- 1. Chiamata API REALE a thirdweb Engine per creare un nuovo wallet ---
    const engineResponse = await fetch(
      `${process.env.THIRDWEB_ENGINE_URL}/backend-wallet/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.THIRDWEB_SECRET_KEY}`,
        },
        body: JSON.stringify({}),
      }
    );

    if (!engineResponse.ok) {
        const errorBody = await engineResponse.json();
        throw new Error(`Errore da Engine: ${errorBody.error.message}`);
    }

    const newWalletData = await engineResponse.json();
    const newWalletAddress = newWalletData.result.walletAddress;

    if (!newWalletAddress) {
        throw new Error("Engine non ha restituito un indirizzo valido per il wallet.");
    }

    // --- 2. Aggiorna il nostro database Firestore ---
    const collectionName = companyStatus === 'pending' ? 'pendingCompanies' : 'activeCompanies';
    const companyRef = db.collection(collectionName).doc(companyId);
    
    await companyRef.update({
      relayerWalletAddress: newWalletAddress
    });

    // --- (Opzionale) 3. Finanzia il nuovo wallet ---
    console.log(`Azione successiva (da implementare): Finanziare ${newWalletAddress} con MATIC.`);

    res.status(200).json({ 
        message: `Wallet Relayer creato e assegnato con successo!`,
        relayerAddress: newWalletAddress 
    });

  } catch (error) {
    console.error("Errore durante la creazione del relayer:", error);
    res.status(500).json({ error: (error as Error).message || "Internal Server Error" });
  }
};
