import { useEffect } from "react";

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const icons = {
    success: "fa-circle-check",
    error: "fa-circle-xmark",
    warning: "fa-triangle-exclamation",
    info: "fa-circle-info",
  };

  return (
    <div className={`toast-glass toast-${toast.type}`}>
      <div className="d-flex align-items-start gap-3">
        <i className={`fas ${icons[toast.type]} toast-icon`}></i>

        <div className="flex-grow-1">
          <h6 className="mb-1">{toast.title}</h6>
          <small>{toast.message}</small>
        </div>

        <button className="toast-close" onClick={onClose}>
          <i className="fas fa-xmark"></i>
        </button>
      </div>

      <div className="toast-progress"></div>
    </div>
  );
}