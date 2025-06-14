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
    const accessToken = process.env.THIRDWEB_VAULT_ACCESS_TOKEN; // Usiamo anche l'access token

    if (!engineUrl || !secretKey || !accessToken) {
        console.error("Variabili d'ambiente di Engine non configurate correttamente su Vercel.");
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
          // Aggiungiamo l'access token per le operazioni sul vault
          'x-thirdweb-access-token': accessToken,
        },
        body: JSON.stringify({}),
      }
    );

    const responseText = await engineResponse.text(); // Leggiamo la risposta come testo per sicurezza
    console.log("Risposta da Engine:", responseText);

    if (!engineResponse.ok) {
        // Se la risposta non è JSON, la mostriamo direttamente
        throw new Error(`Errore da Engine (${engineResponse.status}): ${responseText}`);
    }

    const newWalletData = JSON.parse(responseText); // Ora possiamo parsare il JSON
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
    console.error("Errore critico durante la creazione del relayer:", error);
    res.status(500).json({ error: (error as Error).message || "Internal Server Error" });
  }
};
