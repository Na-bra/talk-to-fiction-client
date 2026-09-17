import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';
import { Banner, Segmented, Spinner } from '../components/ui.jsx';
import { useDocumentTitle } from '../lib/hooks.js';
import { safeNext } from '../lib/redirect.js';

const MODES = [
  { value: 'signin', label: 'Sign in' },
  { value: 'signup', label: 'Create account' },
];

/** Google's mark, in its own colours. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

/** A failed or cancelled Google sign-in comes back with the reason in the URL. */
function oauthErrorFromUrl() {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  return search.get('error_description') || hash.get('error_description') || '';
}

export default function Login() {
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(oauthErrorFromUrl);
  const [notice, setNotice] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);
  const signingUp = mode === 'signup';
  // Where to go once signed in: from the route guard, or carried through the
  // Google round trip as ?next=.
  const next = safeNext(location.state?.from || new URLSearchParams(location.search).get('next'));
  useDocumentTitle(signingUp ? 'Create account' : 'Sign in');

  if (user) return <Navigate to={next} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    const { data, error: authError } = signingUp
      ? await signUp(email, password)
      : await signIn(email, password);
    setBusy(false);
    if (authError) return setError(authError.message);
    // With email confirmation on, sign-up returns a user but no session yet.
    if (signingUp && !data.session) {
      setNotice('Check your inbox to confirm your address, then sign in.');
      setMode('signin');
    }
  };

  const continueWithGoogle = async () => {
    setError('');
    setNotice('');
    setGoogleBusy(true);
    // On success the browser leaves for Google, so only a failure returns here.
    const { error: authError } = await signInWithGoogle(next);
    if (authError) {
      setGoogleBusy(false);
      setError(authError.message);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setNotice('');
  };

  return (
    <div className="auth">
      <aside className="auth-art" aria-hidden="true">
        <span className="brand">
          <span className="brand-mark">T</span>
          Talk to Fiction
        </span>
        <div className="auth-quote">
          <p className="auth-headline">Characters who remember you.</p>
          <p className="auth-sub">
            Build a cast, open their files, and talk with them. Every conversation changes what they
            think of you.
          </p>
        </div>
        <ul className="auth-points">
          <li>
            <Icon name="lock" />
            Private to your account
          </li>
          <li>
            <Icon name="bookmark" />
            They remember what you tell them
          </li>
          <li>
            <Icon name="chat" />
            Trust is earned one conversation at a time
          </li>
        </ul>
      </aside>

      <main className="auth-main page">
        <div className="auth-card">
          <span className="brand auth-mobile-brand">
            <span className="brand-mark" aria-hidden="true">
              T
            </span>
            Talk to Fiction
          </span>

          <h1 className="title-1">{signingUp ? 'Create your account' : 'Welcome back'}</h1>
          <p className="muted auth-lede">
            {signingUp
              ? 'Start an archive of characters that are yours alone.'
              : 'Sign in to return to your characters.'}
          </p>

          <div className="auth-oauth">
            <button
              type="button"
              className="btn btn-secondary btn-lg btn-block"
              onClick={continueWithGoogle}
              disabled={googleBusy || busy}
            >
              {googleBusy ? <Spinner /> : <GoogleMark />}
              Continue with Google
            </button>
          </div>

          <p className="auth-divider">
            <span>or use your email</span>
          </p>

          <Segmented label="Account access" options={MODES} value={mode} onChange={switchMode} />

          <form className="auth-form" onSubmit={submit}>
            <div className="field">
              <label className="field-label" htmlFor="auth-email">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                className="input"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="auth-password">
                Password
              </label>
              <div className="input-affix trailing">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  autoComplete={signingUp ? 'new-password' : 'current-password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-describedby={signingUp ? 'auth-password-hint' : undefined}
                />
                <button
                  type="button"
                  className="icon-btn icon-btn-sm"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} />
                </button>
              </div>
              {signingUp && (
                <p className="field-hint" id="auth-password-hint">
                  At least 6 characters, with upper and lower case letters, a number and a symbol.
                </p>
              )}
            </div>

            {error && <Banner>{error}</Banner>}
            {notice && <Banner tone="info">{notice}</Banner>}

            <button className="btn btn-primary btn-lg btn-block" disabled={busy || googleBusy}>
              {busy && <Spinner />}
              {busy ? 'One moment…' : signingUp ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
