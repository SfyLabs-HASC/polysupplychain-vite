// FILE: api/auth.ts
// VERSIONE CON LOGGING E CONTROLLI DI ERRORE MIGLIORATI

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { utils } from 'ethers';

// --- Inizializzazione di Firebase Admin SDK ---
let serviceAccount: any;

try {
  // Controlla se la variabile d'ambiente segreta esiste.
  if (!process.env.FIREBASE_ADMIN_SDK_JSON) {
    throw new Error("La variabile d'ambiente FIREBASE_ADMIN_SDK_JSON non è impostata su Vercel.");
  }
  // Tenta di fare il parse del JSON. Se fallisce, il JSON è malformato.
  serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_JSON);
} catch (error: any) {
  console.error("ERRORE CRITICO: Impossibile fare il parse della Service Account Key.", error.message);
  // Se la configurazione è sbagliata, la funzione non può MAI funzionare.
  // Usciamo subito per non causare ulteriori problemi.
  throw new Error("La Service Account Key in FIREBASE_ADMIN_SDK_JSON è malformata o mancante.");
}


// Inizializza l'app di Firebase Admin solo se non è già stata inizializzata.
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

// --- Funzione Principale (Handler) ---
export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).send({ error: 'Metodo non consentito' });
  }

  try {
    const { address, signature } = request.body;

    if (!address || !signature) {
      return response.status(400).send({ error: 'Indirizzo e firma sono richiesti.' });
    }

    const messageToVerify = `Sto facendo il login a EasyChain con il mio wallet: ${address}`;
    const recoveredAddress = utils.verifyMessage(messageToVerify, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return response.status(401).send({ error: 'Firma non valida o non corrispondente.' });
    }

    const customToken = await getAuth().createCustomToken(address);
    return response.status(200).send({ token: customToken });

  } catch (error: any) {
    console.error("Errore durante la generazione del token:", error.message);
    return response.status(500).send({ error: 'Errore interno del server durante l_autenticazione.' });
  }
}
