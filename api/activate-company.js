// FILE: api/activate-company.js
// AGGIORNATO: Ora gestisce tutte le azioni di modifica dello stato e dei crediti.

import admin from 'firebase-admin';

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

    // N.B.: Le chiamate ON-CHAIN ora avvengono dal frontend.
    // Questa API si occupa solo di aggiornare il DATABASE dopo il successo.

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
        return res.status(200).json({ message: "Database aggiornato: Azienda attivata." });

    } else if (action === 'deactivate') {
        await activeRef.update({ status: 'deactivated' });
        return res.status(200).json({ message: "Database aggiornato: Azienda disattivata." });
    
    } else if (action === 'reactivate') {
        await activeRef.update({ status: 'active' });
        return res.status(200).json({ message: "Database aggiornato: Azienda riattivata." });

    } else if (action === 'setCredits') {
        await activeRef.update({ credits: credits });
        return res.status(200).json({ message: "Database aggiornato: Crediti impostati." });
    }
    
    res.status(400).json({ error: "Azione non valida." });

  } catch (error) {
    console.error("Errore durante la gestione dell'azienda:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
