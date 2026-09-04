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
  };

  const titles = {
    success: "Success",
    error: "Error",
    warning: "Warning",
  };

  return (
    <div className="toast-container-custom">
      <div className={`toast-card toast-${toast.type}`}>
        <div className="toast-top">
          <div className="toast-left">
            <i className={`fas ${icons[toast.type]} toast-icon`}></i>

            <div>
              <h6 className="toast-title">
                {toast.title || titles[toast.type]}
              </h6>

              <p className="toast-text">{toast.text}</p>
            </div>
          </div>

          <button className="toast-close" onClick={onClose}>
            <i className="fas fa-xmark"></i>
          </button>
        </div>

        <div className="toast-progress">
          <div className="toast-progress-fill"></div>
        </div>
      </div>
    </div>
  );
}