import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { user, signIn, signUp } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  if (user) return <Navigate to={location.state?.from || '/'} replace />;

  const signingUp = mode === 'signup';

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

  const switchMode = () => {
    setMode(signingUp ? 'signin' : 'signup');
    setError('');
    setNotice('');
  };

  return (
    <div className="auth">
      <div className="page-head">
        <div>
          <span className="label">Registry access</span>
          <h1>{signingUp ? 'Open an account' : 'Sign in'}</h1>
        </div>
      </div>
      <p className="auth-lede">
        Your characters, your conversations with them, and what they remember about you are
        private to your account.
      </p>

      <form className="form panel" onSubmit={submit}>
        <label className="input-group">
          <span className="label">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="input-group">
          <span className="label">Password</span>
          <input
            type="password"
            autoComplete={signingUp ? 'new-password' : 'current-password'}
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <div className="banner">{error}</div>}
        {notice && <div className="banner notice">{notice}</div>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'One moment…' : signingUp ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <p className="auth-switch">
        {signingUp ? 'Already registered?' : 'No account yet?'}{' '}
        <button type="button" className="linkish" onClick={switchMode}>
          {signingUp ? 'Sign in' : 'Create one'}
        </button>
      </p>
    </div>
  );
}
