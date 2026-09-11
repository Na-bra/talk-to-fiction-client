import { createContext, useCallback, useContext, useState } from 'react';
import Icon from './components/Icon.jsx';

const ToastContext = createContext(() => {});

/** Brief confirmations ("Saved", "Reset") announced to screen readers. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, { tone = 'success' } = {}) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div className={`toast ${toast.tone === 'error' ? 'is-error' : ''}`} key={toast.id}>
            <Icon name={toast.tone === 'error' ? 'alert' : 'check'} />
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
