import { useEffect, useState } from 'react';

// The preference is 'dark' (the default), 'light' or 'system'. index.html
// applies it before first paint so there is no flash; this keeps it in sync.
const KEY = 'ttf-theme';
const media = window.matchMedia('(prefers-color-scheme: light)');

function readPreference() {
  try {
    return localStorage.getItem(KEY) || 'dark';
  } catch {
    return 'dark';
  }
}

function apply(preference) {
  const resolved = preference === 'system' ? (media.matches ? 'light' : 'dark') : preference;
  document.documentElement.dataset.theme = resolved;
}

export function useTheme() {
  const [preference, setPreference] = useState(readPreference);

  useEffect(() => {
    apply(preference);
    if (preference !== 'system') return undefined;
    const onChange = () => apply('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [preference]);

  const choose = (next) => {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Private mode: the choice still applies for this visit.
    }
    setPreference(next);
  };

  return [preference, choose];
}
