import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS!))
    });
  } catch (error: any) {
    console.error("Firebase Admin initialization error:", error.message);
  }
}

const db = getFirestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Solo richieste POST sono ammesse' });
  }

  try {
    const { ownerAddress, companyName, credits, status } = req.body;

    if (!ownerAddress || !companyName) {
      return res.status(400).json({ message: 'Indirizzo e nome azienda sono obbligatori.' });
    }

    const companyRef = db.collection('companies').doc(ownerAddress);

    await companyRef.set({
        walletAddress: ownerAddress,
        companyName,
        credits: credits !== undefined ? credits : 0,
        status: status ? 'active' : 'pending'
    }, { merge: true });

    res.status(200).json({ message: 'Dettagli azienda aggiornati con successo.' });

  } catch (error: any) {
    console.error("Errore nell'aggiornare i dettagli dell'azienda:", error);
    res.status(500).json({ message: 'Errore interno del server.', details: error.message });
  }
}
