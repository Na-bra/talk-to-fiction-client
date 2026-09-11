export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?';

export const firstName = (name = '') => name.trim().split(/\s+/)[0] || name;

// Muted hues for avatar plates — ochre, rust, slate, sage, clay, sand, teal,
// ink. The name picks one, so a character keeps its colour everywhere.
const TONES = [62, 32, 235, 150, 20, 80, 195, 265];

export function toneFor(seed = '') {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  return TONES[hash % TONES.length];
}

/** "Detective · Age 32" — whatever of the two is known. */
export const identityLine = (npc) =>
  [npc.occupation, npc.age !== null && npc.age !== undefined && npc.age !== '' ? `Age ${npc.age}` : null]
    .filter(Boolean)
    .join(' · ');

const RELATIVE = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
const STEPS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

export function relativeTime(date) {
  if (!date) return '';
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  for (const [unit, size] of STEPS) {
    if (Math.abs(seconds) >= size) return RELATIVE.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

export const formatDate = (date, options = { dateStyle: 'medium' }) =>
  date ? new Intl.DateTimeFormat(undefined, options).format(new Date(date)) : '';

export const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

export const RELATIONSHIP_AXES = [
  { key: 'trust', label: 'Trust', caution: false },
  { key: 'friendship', label: 'Friendship', caution: false },
  { key: 'suspicion', label: 'Suspicion', caution: true },
  { key: 'fear', label: 'Fear', caution: true },
];
