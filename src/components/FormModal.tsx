import { ReactNode } from "react";

type FormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export default function FormModal({ isOpen, onClose, title, children }: FormModalProps) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={{ marginTop: 0 }}>{title || "Modal"}</h2>
        <div>{children}</div>
        <button onClick={onClose} style={styles.closeBtn}>Chiudi</button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed" as "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  },
  modal: {
    background: "white",
    borderRadius: 8,
    padding: 20,
    width: "90%",
    maxWidth: 500,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  },
  closeBtn: {
    marginTop: 20,
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: 4,
    cursor: "pointer"
  }
};
