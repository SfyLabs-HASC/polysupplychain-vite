// src/firebaseConfig.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Leggiamo le credenziali dalle Environment Variables fornite da Vercel.
// Il prefisso VITE_ è necessario per renderle accessibili nel frontend.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Controlla che le variabili siano state caricate correttamente per evitare errori
if (!firebaseConfig.projectId) {
  throw new Error("Configurazione di Firebase non trovata. Assicurati di aver impostato le variabili d'ambiente su Vercel.");
}

// Inizializza i servizi di Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Esporta le istanze per poterle usare nel resto dell'applicazione
export { app, db };