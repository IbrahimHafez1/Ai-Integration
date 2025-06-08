import '../pages/OAuth.css';

export default function Modal({ title, message, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-buttons">
          <button className="modal-button" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
