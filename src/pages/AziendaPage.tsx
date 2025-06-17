// Sostituisci il vecchio ActiveUserDashboard con questo nuovo codice completo

const ActiveUserDashboard = () => {
  const [modal, setModal] = useState<'init' | 'add' | 'close' | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<bigint | null>(null);

  // 1. STATO PER I FORM
  // Creiamo uno stato per contenere i dati inseriti dall'utente
  const [formData, setFormData] = useState({
    // Campi per 'initializeBatch'
    batchName: "",
    batchDescription: "",
    // Campi per 'addStepToBatch'
    stepName: "",
    stepDescription: "",
    stepLocation: "",
  });

  // 2. HANDLER PER AGGIORNARE LO STATO
  // Funzione generica per aggiornare il nostro stato quando l'utente scrive negli input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. FUNZIONE DI SUCCESSO RESA PIÙ ROBUSTA
  const handleTransactionSuccess = (receipt: any, type: 'init' | 'add' | 'close') => {
    console.log("Receipt ricevuto per il debug:", receipt); // Aggiungiamo un log per il debug
    setModal(null); // Chiudi il modale
    
    if (type === 'init') {
      try {
        const events = parseEventLogs({ logs: receipt.logs, abi, eventName: "BatchInitialized" });
        // CONTROLLO DI SICUREZZA: Verifichiamo che l'array di eventi non sia vuoto
        if (events.length > 0) {
          const newBatchId = events[0].args.batchId;
          setActiveBatchId(newBatchId);
          alert(`✅ Batch Inizializzato! Nuovo ID: ${newBatchId}`);
        } else {
          // Se l'array è vuoto, diamo un messaggio più specifico
          alert("✅ Batch creato, ma l'evento non è stato trovato nella ricevuta. L'ID non può essere recuperato automaticamente.");
          console.error("Nessun evento 'BatchInitialized' trovato nel receipt:", receipt.logs);
        }
      } catch (e) {
        console.error("Errore nel parsing degli eventi:", e);
        alert("✅ Batch creato, ma si è verificato un errore nel recuperare l'ID.");
      }
    } else if (type === 'add') {
      alert(`✅ Step aggiunto al batch ${activeBatchId}!`);
    } else if (type === 'close') {
      alert(`✅ Batch ${activeBatchId} chiuso con successo!`);
      setActiveBatchId(null);
    }
  };
  
  return (
    <div className="card">
      <h3 style={{color: '#34d399'}}>✅ ACCOUNT ATTIVATO</h3>
      <p>Benvenuto nella tua dashboard. Le seguenti azioni sono sponsorizzate (gasless).</p>
      
      {activeBatchId && <div style={{background: '#27272a', padding: '1rem', borderRadius: '8px', margin: '1rem 0'}}><p style={{margin:0}}>Stai lavorando sul Batch ID: <strong>{activeBatchId.toString()}</strong></p></div>}

      <div className="modal-actions">
        <button className="web3-button" onClick={() => setModal('init')}>1. Inizializza Batch</button>
        <button className="web3-button" onClick={() => setModal('add')} disabled={!activeBatchId}>2. Aggiungi Step</button>
        <button className="web3-button" onClick={() => setModal('close')} disabled={!activeBatchId} style={{backgroundColor: '#ef4444'}}>3. Chiudi Batch</button>
      </div>

      {/* --- MODALE INITIALIZE BATCH CON FORM --- */}
      {modal === 'init' && 
        <FormModal title="Inizializza Nuovo Batch" onClose={() => setModal(null)}>
          <div className="form-group">
            <label>Nome del Lotto/Prodotto</label>
            <input type="text" name="batchName" value={formData.batchName} onChange={handleInputChange} className="form-input" />
          </div>
          <div className="form-group" style={{marginTop: '1rem'}}>
            <label>Descrizione</label>
            <input type="text" name="batchDescription" value={formData.batchDescription} onChange={handleInputChange} className="form-input" />
          </div>
          <TransactionButton
            transaction={() => prepareContractCall({
              contract, 
              abi, 
              method: "function initializeBatch(string _name, string _description, string _date, string _location, string _imageIpfsHash)",
              // Usiamo i dati dallo stato invece che hardcoded
              params: [ formData.batchName, formData.batchDescription, new Date().toLocaleDateString(), "Web App", "ipfs://..."]
            })}
            onTransactionConfirmed={(receipt) => handleTransactionSuccess(receipt, 'init')}
            onError={(error) => alert(`❌ Errore: ${error.message}`)}
            className="web3-button"
            style={{marginTop: '1.5rem'}}
          >
            Conferma Inizializzazione
          </TransactionButton>
        </FormModal>
      }
      
      {/* --- MODALE ADD STEP CON FORM --- */}
      {modal === 'add' && activeBatchId &&
        <FormModal title={`Aggiungi Step al Batch #${activeBatchId.toString()}`} onClose={() => setModal(null)}>
          <div className="form-group">
            <label>Nome dello Step (es. "Raccolta", "Spedizione")</label>
            <input type="text" name="stepName" value={formData.stepName} onChange={handleInputChange} className="form-input" />
          </div>
          <div className="form-group" style={{marginTop: '1rem'}}>
            <label>Descrizione</label>
            <input type="text" name="stepDescription" value={formData.stepDescription} onChange={handleInputChange} className="form-input" />
          </div>
          <div className="form-group" style={{marginTop: '1rem'}}>
            <label>Luogo</label>
            <input type="text" name="stepLocation" value={formData.stepLocation} onChange={handleInputChange} className="form-input" />
          </div>
          <TransactionButton
            transaction={() => prepareContractCall({
              contract, 
              abi, 
              method: "function addStepToBatch(uint256 _batchId, string _eventName, string _description, string _date, string _location, string _attachmentsIpfsHash)",
              // Usiamo i dati dallo stato
              params: [ activeBatchId, formData.stepName, formData.stepDescription, new Date().toLocaleDateString(), formData.stepLocation, "ipfs://..."]
            })}
            onTransactionConfirmed={(receipt) => handleTransactionSuccess(receipt, 'add')}
            onError={(error) => alert(`❌ Errore: ${error.message}`)}
            className="web3-button"
            style={{marginTop: '1.5rem'}}
          >
            Conferma Aggiunta Step
          </TransactionButton>
        </FormModal>
      }

      {/* --- MODALE CLOSE BATCH (INVARIATO) --- */}
      {modal === 'close' && activeBatchId &&
        <FormModal title={`Chiudi Batch #${activeBatchId.toString()}`} onClose={() => setModal(null)}>
          <p>Sei sicuro di voler chiudere questo batch? L'azione è irreversibile e consumerà 1 credito.</p>
          <TransactionButton
            transaction={() => prepareContractCall({ 
              contract, 
              abi, 
              method: "function closeBatch(uint256 _batchId)", 
              params: [activeBatchId] 
            })}
            onTransactionConfirmed={(receipt) => handleTransactionSuccess(receipt, 'close')}
            onError={(error) => alert(`❌ Errore: ${error.message}`)}
            className="web3-button" style={{backgroundColor: '#ef4444'}}
          >
            Conferma Chiusura
          </TransactionButton>
        </FormModal>
      }
    </div>
  );
};