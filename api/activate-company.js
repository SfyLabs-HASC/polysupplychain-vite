// FILE: api/activate-company.js
// Gestisce tutte le azioni di modifica su un contributor.

import admin from 'firebase-admin';
// In futuro, importeremo thirdweb Engine qui per le chiamate on-chain.

// Funzione di inizializzazione di Firebase (la stessa di prima)
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
    const { action, walletAddress, companyName, credits } = req.body;
    if (!action || !walletAddress) {
        return res.status(400).json({ error: "Azione o indirizzo wallet mancanti." });
    }

    // --- AZIONI ON-CHAIN (per ora simulate) ---
    // In futuro, il tuo server chiamerà thirdweb Engine per eseguire queste operazioni
    // usando il tuo wallet admin. Questo è un passaggio di sicurezza fondamentale.
    console.log(`Azione richiesta: ${action} per wallet ${walletAddress}`);
    if (action === 'activate') {
        console.log(`Simulazione chiamata on-chain: addContributor(${walletAddress}, ${companyName})`);
        console.log(`Simulazione chiamata on-chain: setContributorCredits(${walletAddress}, ${credits})`);
    } else if (action === 'deactivate') {
        console.log(`Simulazione chiamata on-chain: deactivateContributor(${walletAddress})`);
    } else if (action === 'setCredits') {
        console.log(`Simulazione chiamata on-chain: setContributorCredits(${walletAddress}, ${credits})`);
    }

    // --- AZIONI OFF-CHAIN (sul nostro database Firestore) ---
    const pendingRef = db.collection('pendingCompanies').doc(walletAddress);
    const activeRef = db.collection('activeCompanies').doc(walletAddress);

    if (action === 'activate') {
        const doc = await pendingRef.get();
        if (!doc.exists) return res.status(404).json({ error: "Azienda in pending non trovata." });
        const companyData = doc.data();
        
        const batch = db.batch();
        batch.set(activeRef, { ...companyData, status: 'active', credits: credits, activatedAt: admin.firestore.FieldValue.serverTimestamp() });
        batch.delete(pendingRef);
        await batch.commit();
        return res.status(200).json({ message: "Azienda attivata con successo." });

    } else if (action === 'deactivate') {
        await activeRef.update({ status: 'deactivated' });
        return res.status(200).json({ message: "Azienda disattivata." });

    } else if (action === 'setCredits') {
        await activeRef.update({ credits: credits });
        return res.status(200).json({ message: "Crediti aggiornati." });
    }
    
    res.status(400).json({ error: "Azione non valida." });

  } catch (error) {
    console.error("Errore durante la gestione dell'azienda:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
