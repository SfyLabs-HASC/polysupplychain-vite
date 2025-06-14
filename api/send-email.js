// FILE: api/send-email.js
// AGGIORNATO: Ora salva la richiesta su Firestore prima di inviare l'email.

import { Resend } from 'resend';
import admin from 'firebase-admin';

// --- Configurazione di Firebase Admin ---
// Inizializza l'app di Firebase solo se non è già stata inizializzata.
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Le backslash (\n) vengono sostituite per interpretare correttamente la chiave
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }
} catch (error) {
  console.error('Firebase admin initialization error', error.stack);
}

const db = admin.firestore();
const resend = new Resend(process.env.RESEND_API_KEY);

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { companyName, contactEmail, sector, walletAddress, ...socials } = req.body;

    // --- NUOVO: SALVA SU FIRESTORE ---
    // Creiamo un nuovo documento nella collezione "pendingCompanies".
    // Usiamo l'indirizzo del wallet come ID unico del documento per evitare duplicati.
    const pendingRef = db.collection('pendingCompanies').doc(walletAddress);
    await pendingRef.set({
      companyName,
      contactEmail,
      sector,
      walletAddress,
      status: 'pending',
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...socials,
    });
    
    // --- Invio Email (logica invariata) ---
    await resend.emails.send({
      from: 'Easy Chain <onboarding@resend.dev>',
      to: ['sfy.startup@gmail.com'],
      subject: `Nuova Richiesta Attivazione: ${companyName}`,
      html: `<div>... (il tuo template HTML per l'email) ...</div>`, // Inserisci qui l'HTML dell'email
    });

    res.status(200).json({ message: "Request received and saved." });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
