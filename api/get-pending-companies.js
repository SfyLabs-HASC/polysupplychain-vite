// FILE: api/get-pending-companies.js
// NUOVO: Questo endpoint legge le aziende in pending dal nostro database Firestore.

import admin from 'firebase-admin';

// Funzione per inizializzare Firebase Admin in modo sicuro (evita inizializzazioni multiple)
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Sostituisce i caratteri di escape per interpretare correttamente la chiave privata da Vercel
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } catch (error) {
      console.error('Firebase admin initialization error', error.stack);
    }
  }
  return admin.firestore();
}

const db = initializeFirebaseAdmin();

export default async (req, res) => {
  // Rispondiamo solo a richieste di tipo GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Interroghiamo la collezione "pendingCompanies" in Firestore,
    // prendendo solo i documenti con status "pending" e ordinandoli per data di richiesta.
    const snapshot = await db.collection('pendingCompanies')
                             .where('status', '==', 'pending')
                             .orderBy('requestedAt', 'desc')
                             .get();
    
    // Se non ci sono documenti, restituiamo un array vuoto.
    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    // Trasformiamo i documenti di Firestore in un array di oggetti JSON
    const pendingCompanies = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Convertiamo il timestamp di Firestore in una stringa ISO (formato standard) se esiste
      if (data.requestedAt) {
        data.requestedAt = data.requestedAt.toDate().toISOString();
      }
      pendingCompanies.push({ id: doc.id, ...data });
    });

    // Restituiamo la lista di aziende in pending
    res.status(200).json(pendingCompanies);

  } catch (error) {
    console.error("Error fetching pending companies:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
