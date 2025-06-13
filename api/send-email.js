// FILE: api/send-email.js
// Questa è la nostra funzione serverless sicura che invia l'email.
// Vercel la trasformerà automaticamente in un endpoint API.

import { Resend } from 'resend';

// Creiamo un client di Resend usando la nostra chiave API segreta
// che leggeremo dalle variabili d'ambiente di Vercel.
const resend = new Resend(process.env.RESEND_API_KEY);

// La funzione handler che riceve la richiesta dal nostro frontend
export default async (req, res) => {
  // Accettiamo solo richieste POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    // Estraiamo i dati del form inviati dal frontend
    const { companyName, contactEmail, sector, walletAddress, ...socials } = req.body;

    // Invia l'email usando Resend
    const { data, error } = await resend.emails.send({
      from: 'PolySupplyChain <onboarding@resend.dev>', // Mittente speciale per il piano gratuito
      to: ['sfy.startup@gmail.com'], // La tua email di destinazione
      subject: `Nuova Richiesta Attivazione: ${companyName}`,
      // Usiamo React per creare un'email HTML ben formattata
      react: `
        <div>
          <h2>Nuova Richiesta di Attivazione</h2>
          <p>Un'azienda ha richiesto l'attivazione sulla piattaforma.</p>
          <hr />
          <h3>Dettagli Richiesta:</h3>
          <ul>
            <li><strong>Nome Azienda:</strong> ${companyName}</li>
            <li><strong>Email Contatto:</strong> ${contactEmail}</li>
            <li><strong>Settore:</strong> ${sector}</li>
            <li><strong>Wallet Address:</strong> ${walletAddress}</li>
          </ul>
          <h3>Social (Opzionali):</h3>
          <ul>
            <li><strong>Sito Web:</strong> ${socials.website || 'N/D'}</li>
            <li><strong>Facebook:</strong> ${socials.facebook || 'N/D'}</li>
            <li><strong>Instagram:</strong> ${socials.instagram || 'N/D'}</li>
            <li><strong>Twitter/X:</strong> ${socials.twitter || 'N/D'}</li>
            <li><strong>TikTok:</strong> ${socials.tiktok || 'N/D'}</li>
          </ul>
        </div>
      `,
    });

    if (error) {
      return res.status(400).json(error);
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json(error);
  }
};
