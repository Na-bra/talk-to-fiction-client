import { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon.jsx';

/**
 * An overflow menu following the WAI-ARIA menu button pattern: arrow keys move,
 * Escape closes and returns focus, clicking outside dismisses.
 * `items` is a list of { label, icon, onSelect, danger } or the string 'separator'.
 */
export default function Menu({ label, items, icon = 'more', tip }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    listRef.current?.querySelector('[role="menuitem"]')?.focus();
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (event) => {
    const entries = [...listRef.current.querySelectorAll('[role="menuitem"]')];
    const index = entries.indexOf(document.activeElement);
    const move = {
      ArrowDown: (index + 1) % entries.length,
      ArrowUp: (index - 1 + entries.length) % entries.length,
      Home: 0,
      End: entries.length - 1,
    }[event.key];
    if (move !== undefined) {
      event.preventDefault();
      entries[move].focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className="menu" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="icon-btn"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        data-tip={open ? undefined : tip}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name={icon} />
      </button>
      {open && (
        <div className="menu-list" role="menu" id={menuId} aria-label={label} ref={listRef} onKeyDown={onKeyDown}>
          {items.map((item, index) =>
            item === 'separator' ? (
              <div className="menu-sep" role="separator" key={`sep-${index}`} />
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                tabIndex={-1}
                className={`menu-item ${item.danger ? 'is-danger' : ''}`}
                onClick={() => {
                  close();
                  item.onSelect();
                }}
              >
                {item.icon && <Icon name={item.icon} />}
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
