/**
 * Where to send someone after sign-in. Only same-site paths are accepted, so a
 * crafted ?next= cannot bounce a person to another site once they sign in.
 */
export function safeNext(value) {
  if (typeof value !== 'string') return '/';
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/';
  if (value === '/login' || value.startsWith('/login?') || value.startsWith('/login/')) return '/';
  return value;
}
