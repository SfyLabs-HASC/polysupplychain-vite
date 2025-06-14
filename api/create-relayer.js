// FILE: api/create-relayer.js
// VERSIONE REALE E CORRETTA: Usa le chiavi corrette e ha una gestione degli errori migliore.

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

    // Controlliamo che tutte le variabili d'ambiente necessarie esistano
    const engineUrl = process.env.THIRDWEB_ENGINE_URL;
    const secretKey = process.env.THIRDWEB_SECRET_KEY;

    if (!engineUrl || !secretKey) {
        console.error("ERRORE: Variabili d'ambiente di Engine (URL o SECRET_KEY) non configurate correttamente su Vercel.");
        throw new Error("Configurazione del server incompleta.");
    }
    
    // --- 1. Chiamata API REALE a thirdweb Engine per creare un nuovo wallet ---
    console.log("Tentativo di creare un wallet su Engine...");
    const engineResponse = await fetch(
      `${engineUrl}/backend-wallet/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secretKey}`,
        },
        body: JSON.stringify({}), // Il corpo può essere vuoto
      }
    );

    const responseText = await engineResponse.text(); // Leggiamo la risposta come testo per sicurezza
    console.log(`Risposta da Engine: (Status: ${engineResponse.status})`, responseText);

    if (!engineResponse.ok) {
        throw new Error(`Errore da Engine: ${responseText}`);
    }

    const newWalletData = JSON.parse(responseText);
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

    res.status(200).json({ 
        message: `Wallet Relayer creato e assegnato con successo!`,
        relayerAddress: newWalletAddress 
    });

  } catch (error) {
    // Gestione errore corretta per JavaScript
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Errore critico durante la creazione del relayer:", errorMessage);
    res.status(500).json({ error: errorMessage });
  }
};
