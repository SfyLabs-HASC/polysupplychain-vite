// FILE: /api/add-batch.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inizializza l'app di Firebase Admin solo una volta
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS!))
  });
}

const db = getFirestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Solo richieste POST sono ammesse' });
  }

  try {
    const { batchId, ownerAddress, name, description, date, location, imageIpfsHash } = req.body;

    // Validazione dei dati ricevuti
    if (!batchId || !ownerAddress || !name) {
      return res.status(400).json({ message: 'Dati mancanti o non validi.' });
    }

    // Usiamo l'ID del batch on-chain come ID del documento nel database per coerenza
    const batchRef = db.collection('batches').doc(batchId.toString());

    await batchRef.set({
      ownerAddress,
      name,
      description: description || "",
      date: date || "",
      location: location || "",
      imageIpfsHash: imageIpfsHash || "N/A",
      isClosed: false, // Un nuovo batch è sempre aperto
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({ message: 'Batch salvato con successo su Firebase.' });

  } catch (error: any) {
    console.error("Errore nel salvare su Firebase:", error);
    res.status(500).json({ message: 'Errore interno del server.', details: error.message });
  }
}