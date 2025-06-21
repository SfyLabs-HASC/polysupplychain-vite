// FILE: /api/get-batches.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS!))
  });
}

const db = getFirestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Solo richieste GET sono ammesse' });
  }

  try {
    const { userAddress } = req.query;

    if (!userAddress || typeof userAddress !== 'string') {
      return res.status(400).json({ message: 'Indirizzo utente non fornito.' });
    }

    const batchesRef = db.collection('batches');
    // Eseguiamo una query per trovare i documenti che appartengono all'utente
    const snapshot = await batchesRef.where('ownerAddress', '==', userAddress).orderBy('createdAt', 'desc').get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const batches: any[] = [];
    snapshot.forEach(doc => {
      batches.push({
        // L'ID del documento è il nostro batchId on-chain
        id: doc.id,
        batchId: BigInt(doc.id), // Lo riconvertiamo in BigInt per coerenza con il frontend
        ...doc.data()
      });
    });

    res.status(200).json(batches);

  } catch (error: any) {
    console.error("Errore nel leggere da Firebase:", error);
    res.status(500).json({ message: 'Errore interno del server.', details: error.message });
  }
}