import { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { Banner, Spinner } from './ui.jsx';

/**
 * Native <dialog> shown modally: focus trapping, Escape and inertness come from
 * the browser. Clicking the backdrop closes it.
 */
export function Dialog({ open, onClose, className = 'dialog', labelledBy, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={className}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      {open && children}
    </dialog>
  );
}

/** Confirmation for destructive or state-changing actions. `onConfirm` may be async and throw. */
export function ConfirmDialog({ open, onClose, ...props }) {
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onClose={busy ? () => {} : onClose} labelledBy={titleId}>
      <ConfirmBody {...props} titleId={titleId} onClose={onClose} busy={busy} setBusy={setBusy} />
    </Dialog>
  );
}

// Mounted only while the dialog is open, so each opening starts clean.
function ConfirmBody({ titleId, onClose, busy, setBusy, title, description, confirmLabel, icon = 'alert', danger = false, onConfirm }) {
  const [error, setError] = useState('');

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="dialog-body">
        <div className={`dialog-icon ${danger ? 'is-danger' : ''}`}>
          <Icon name={icon} />
        </div>
        <h2 id={titleId}>{title}</h2>
        <p className="dialog-desc">{description}</p>
        {error && (
          <div style={{ marginTop: 16 }}>
            <Banner>{error}</Banner>
          </div>
        )}
      </div>
      <div className="dialog-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy} autoFocus>
          Cancel
        </button>
        <button
          type="button"
          className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={confirm}
          disabled={busy}
        >
          {busy && <Spinner />}
          {confirmLabel}
        </button>
      </div>
    </>
  );
}

/** A side sheet for secondary panels on narrow screens. */
export function Sheet({ open, onClose, side = 'left', title, children }) {
  const titleId = useId();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={`sheet ${side === 'right' ? 'is-right' : ''}`}
      labelledBy={titleId}
    >
      <div className="sheet-head">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
      </div>
      <div className="sheet-body">{children}</div>
    </Dialog>
  );
}
