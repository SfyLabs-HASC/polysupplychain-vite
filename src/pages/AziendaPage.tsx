// FILE: src/pages/AziendaPage.tsx (Modifica per usare 1RPC)

import { defineChain } from 'thirdweb/chains';
// ... altri import

const client = createThirdwebClient({ clientId: "IL_TUO_CLIENT_ID" });

// 1. Definiamo la rete Moonbeam usando l'endpoint di 1RPC
const moonbeam1RPC = defineChain({
  id: 1284, // ID della rete Moonbeam
  rpc: "https://1rpc.io/glmr", // <-- UNICA MODIFICA: abbiamo inserito il nuovo RPC
});

// 2. Usiamo la nuova definizione per il contratto e i bottoni di connessione
const contract = getContract({ 
  client, 
  chain: moonbeam1RPC, // <-- Usiamo la nuova definizione
  address: "0x..." // L'indirizzo del tuo contratto su Moonbeam
});

// ... e così via per il resto della pagina, sostituendo il vecchio
// oggetto 'moonbeamPublicRpc' con il nuovo 'moonbeam1RPC'.