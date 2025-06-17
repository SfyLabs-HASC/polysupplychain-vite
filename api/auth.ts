// FILE: api/auth.ts
// Questa è una Serverless Function di Vercel per l'autenticazione personalizzata.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { utils } from 'ethers';

// --- Inizializzazione di Firebase Admin SDK ---
// Questo blocco di codice è il cuore della funzione sicura.

// 1. Controlla se la variabile d'ambiente segreta esiste.
//    Se non c'è, la funzione non può partire e restituisce un errore.
if (!process.env.FIREBASE_ADMIN_SDK_JSON) {
  throw new Error("La variabile d'ambiente FIREBASE_ADMIN_SDK_JSON non è impostata.");
}

// 2. Leggiamo la Service Account Key dalla variabile d'ambiente.
const serviceAccount = JSON.parse(
  process.env.FIREBASE_ADMIN_SDK_JSON as string
);

// 3. Inizializziamo l'app di Firebase Admin solo se non è già stata inizializzata.
//    Questo previene errori quando Vercel riutilizza un'istanza "calda" della funzione.
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

// --- Funzione Principale (Handler) ---
// Questa è la funzione che viene eseguita quando il frontend chiama l'URL /api/auth
export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Per sicurezza, accettiamo solo richieste di tipo POST
  if (request.method !== 'POST') {
    return response.status(405).send({ error: 'Metodo non consentito' });
  }

  try {
    // Estraiamo l'indirizzo del wallet e la firma dal corpo della richiesta
    const { address, signature } = request.body;

    if (!address || !signature) {
      return response.status(400).send({ error: 'Indirizzo e firma sono richiesti.' });
    }

    // Definiamo il messaggio esatto che l'utente deve aver firmato.
    // Questo DEVE essere identico a quello che genereremo nel frontend.
    const messageToVerify = `Sto facendo il login a EasyChain con il mio wallet: ${address}`;

    // Usiamo la libreria 'ethers' per verificare la firma.
    // Questa funzione estrae l'indirizzo del wallet che ha effettivamente firmato il messaggio.
    const recoveredAddress = utils.verifyMessage(messageToVerify, signature);

    // Controlliamo se l'indirizzo recuperato dalla firma corrisponde
    // a quello che ci è stato inviato nel corpo della richiesta.
    // Questo è un controllo di sicurezza fondamentale.
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return response.status(401).send({ error: 'Firma non valida o non corrispondente.' });
    }

    // Se la firma è valida, usiamo Firebase Admin SDK per creare il "pass" (token personalizzato).
    // L'ID utente (uid) in Firebase sarà impostato come l'indirizzo del wallet.
    const customToken = await getAuth().createCustomToken(address);

    // Inviamo il token al frontend.
    return response.status(200).send({ token: customToken });

  } catch (error) {
    console.error("Errore durante la generazione del token d'autenticazione:", error);
    return response.status(500).send({ error: 'Errore interno del server durante l_autenticazione.' });
  }
}
