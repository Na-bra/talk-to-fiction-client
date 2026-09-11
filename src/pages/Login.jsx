import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';
import { Banner, Segmented, Spinner } from '../components/ui.jsx';
import { useDocumentTitle } from '../lib/hooks.js';

const MODES = [
  { value: 'signin', label: 'Sign in' },
  { value: 'signup', label: 'Create account' },
];

export default function Login() {
  const { user, signIn, signUp } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const signingUp = mode === 'signup';
  useDocumentTitle(signingUp ? 'Create account' : 'Sign in');

  if (user) return <Navigate to={location.state?.from || '/'} replace />;

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

  const switchMode = (next) => {
    setMode(next);
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
                  At least 6 characters.
                </p>
              )}
            </div>

            {error && <Banner>{error}</Banner>}
            {notice && <Banner tone="info">{notice}</Banner>}

            <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
              {busy && <Spinner />}
              {busy ? 'One moment…' : signingUp ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
