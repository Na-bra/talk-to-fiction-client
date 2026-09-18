import { useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { initials, toneFor } from '../lib/format.js';

/**
 * A character's portrait, or their initials on a coloured plate when there is
 * no portrait — or when it fails to load, since a signed link can expire.
 */
export function Avatar({ name = '', size = 'md', className = '', src = null }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = Boolean(src) && failedSrc !== src;
  return (
    <span
      className={`avatar avatar-${size} ${showImage ? 'avatar-photo' : ''} ${className}`}
      style={{ '--hue': toneFor(name) }}
      aria-hidden="true"
    >
      {showImage ? (
        <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailedSrc(src)} />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export function UserAvatar({ email = '', size = 'sm' }) {
  return (
    <span className={`avatar avatar-${size} avatar-user`} aria-hidden="true">
      {(email[0] || '?').toUpperCase()}
    </span>
  );
}

export function Banner({ tone = 'error', children, action, onDismiss }) {
  return (
    <div className={`banner ${tone === 'info' ? 'banner-info' : ''}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon name={tone === 'error' ? 'alert' : 'info'} />
      <div className="banner-body">{children}</div>
      {(action || onDismiss) && (
        <div className="banner-actions">
          {action}
          {onDismiss && (
            <button type="button" className="icon-btn icon-btn-sm" onClick={onDismiss} aria-label="Dismiss">
              <Icon name="close" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function Mood({ state, showIntensity = false, large = false }) {
  if (!state?.label) return null;
  return (
    <span
      className={`mood ${large ? 'mood-lg' : ''}`}
      data-mood={state.label.toLowerCase()}
      title={`Intensity ${state.intensity ?? 0} of 100`}
    >
      <span className="mood-dot" />
      {state.label}
      {showIntensity && <span className="faint tabular">· {state.intensity ?? 0}</span>}
    </span>
  );
}

export function EmptyState({ icon, art, title, children, actions }) {
  return (
    <div className="empty-state">
      {art ||
        (icon && (
          <div className="empty-icon">
            <Icon name={icon} />
          </div>
        ))}
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {actions && <div className="empty-state-actions">{actions}</div>}
    </div>
  );
}

export function Skeleton({ width = '100%', height = 14, radius, className = '', style }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export const Spinner = () => <span className="spinner" aria-hidden="true" />;

/** Full-screen hold while the session is being restored. */
export function Boot() {
  return (
    <div className="boot" role="status">
      <span className="brand-mark" aria-hidden="true">
        T
      </span>
      <span className="sr-only">Loading</span>
    </div>
  );
}

/** A radio group styled as a segmented control, with arrow-key movement. */
export function Segmented({ label, options, value, onChange }) {
  const ref = useRef(null);
  const onKeyDown = (event) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const index = options.findIndex((option) => option.value === value);
    const next = options[(index + step + options.length) % options.length];
    onChange(next.value);
    ref.current?.querySelector(`[data-value="${next.value}"]`)?.focus();
  };
  return (
    <div className="segmented" role="radiogroup" aria-label={label} ref={ref} onKeyDown={onKeyDown}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          data-value={option.value}
          aria-checked={option.value === value}
          tabIndex={option.value === value ? 0 : -1}
          onClick={() => onChange(option.value)}
        >
          {option.icon && <Icon name={option.icon} />}
          {option.label}
        </button>
      ))}
    </div>
  );
}
