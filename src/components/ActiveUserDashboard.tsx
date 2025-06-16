export default function ActiveUserDashboard() {
  return (
    <div>
      <h3>✅ Sei registrato come contributor</h3>
      <p>Puoi iniziare a utilizzare il sistema.</p>

      <div style={{ marginTop: "2rem" }}>
        <button style={{ marginBottom: 10 }}>1. Inizializza Batch</button>
        <button style={{ marginBottom: 10 }}>2. Aggiungi Step</button>
        <button style={{ backgroundColor: "#ef4444", color: "white" }}>3. Chiudi Batch</button>
      </div>
    </div>
  );
}
