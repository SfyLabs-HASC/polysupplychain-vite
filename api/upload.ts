// FILE: api/upload.ts
// Questa funzione sicura gestisce l'upload su IPFS usando le tue chiavi segrete.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import formidable from 'formidable';
import fs from 'fs';

// Funzione per disabilitare il parser di default di Vercel,
// così possiamo gestire noi i file multipart/form-data.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).send({ error: 'Metodo non consentito' });
  }

  try {
    // Inizializza lo Storage di Thirdweb con la tua chiave segreta
    // Assicurati che le variabili d'ambiente siano impostate su Vercel
    const storage = new ThirdwebStorage({
      secretKey: process.env.THIRDWEB_SECRET_KEY, // USA LA TUA VARIABILE
    });

    // Usiamo 'formidable' per processare il file inviato dal frontend
    const form = formidable({});
    const [fields, files] = await form.parse(request);
    
    const file = files.image?.[0];

    if (!file) {
      return response.status(400).json({ error: "Nessun file immagine trovato." });
    }

    // Leggiamo il file dal percorso temporaneo in cui formidable lo ha salvato
    const fileStream = fs.createReadStream(file.filepath);

    // Carichiamo il file su IPFS
    const uri = await storage.upload(fileStream, {
        uploadWithoutDirectory: true, // Opzione consigliata per ottenere un hash più pulito
    });

    // Restituiamo l'URI IPFS al frontend
    return response.status(200).json({ uri });

  } catch (error: any) {
    console.error("Errore nell'API di upload:", error);
    return response.status(500).json({ error: `Errore del server: ${error.message}` });
  }
}
