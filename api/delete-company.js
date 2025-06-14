// FILE: api/delete-company.js
// Endpoint per eliminare un'azienda dal database.

import admin from 'firebase-admin';

function initializeFirebaseAdmin() {
  if (!admin.apps.length) { /* ...stessa funzione di prima... */ }
  return admin.firestore();
}
const db = initializeFirebaseAdmin();

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { walletAddress, status } = req.body;
    if (!walletAddress || !status) {
        return res.status(400).json({ error: "Dati mancanti." });
    }
    
    // Per sicurezza, si può eliminare solo se non è attiva
    if (status === "pending") {
        await db.collection('pendingCompanies').doc(walletAddress).delete();
    } else if (status === "deactivated") {
        await db.collection('activeCompanies').doc(walletAddress).delete();
    } else {
        return res.status(403).json({ error: "Non puoi eliminare un'azienda attiva." });
    }

    res.status(200).json({ message: "Azienda eliminata con successo." });
  } catch (error) {
    console.error("Errore durante l'eliminazione:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
