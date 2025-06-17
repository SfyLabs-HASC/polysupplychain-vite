// FILE: api/auth.ts
// VERSIONE FINALE, PIÙ ROBUSTA E RESILIENTE AGLI ERRORI DI CONFIGURAZIONE

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { utils } from 'ethers';

// Funzione helper per inizializzare Firebase Admin in modo sicuro
function initializeFirebaseAdmin(): App {
  // Se l'app è già inizializzata, restituiscila
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Controlla se la variabile d'ambiente segreta esiste
  if (!process.env.FIREBASE_ADMIN_SDK_JSON) {
    throw new Error("La variabile d'ambiente FIREBASE_ADMIN_SDK_JSON non è impostata su Vercel.");
  }

  try {
    // Tenta di fare il parse del JSON.
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_JSON);
    
    // Inizializza l'app di Firebase Admin
    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error: any) {
    console.error("ERRORE CRITICO: Impossibile fare il parse della Service Account Key. Controlla che il JSON incollato in Vercel sia valido.", error.message);
    throw new Error("La Service Account Key in FIREBASE_ADMIN_SDK_JSON è malformata o mancante.");
  }
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
    // Inizializziamo Firebase Admin all'interno della richiesta.
    // Se fallisce, il try/catch catturerà l'errore e darà una risposta JSON.
    initializeFirebaseAdmin(); 
    
    const { address, signature } = request.body;

    if (!address || !signature) {
      return response.status(400).send({ error: 'Indirizzo e firma sono richiesti.' });
    }

    const messageToVerify = `Sto facendo il login a EasyChain con il mio wallet: ${address}`;
    const recoveredAddress = utils.verifyMessage(messageToVerify, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return response.status(401).send({ error: 'Firma non valida o non corrispondente.' });
    }

    // Usiamo getAuth() solo dopo l'inizializzazione sicura
    const customToken = await getAuth().createCustomToken(address);
    return response.status(200).send({ token: customToken });

  } catch (error: any) {
    // Questo catch ora catturerà anche gli errori di inizializzazione
    console.error("Errore nella funzione /api/auth:", error.message);
    return response.status(500).send({ error: `Errore interno del server: ${error.message}` });
  }
}
