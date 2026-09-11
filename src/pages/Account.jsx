import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useLibrary } from '../library.jsx';
import { useTheme } from '../theme.js';
import Icon from '../components/Icon.jsx';
import { Segmented, Spinner, UserAvatar } from '../components/ui.jsx';
import { formatDate, plural } from '../lib/format.js';
import { useDocumentTitle } from '../lib/hooks.js';

const THEMES = [
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'system', label: 'System', icon: 'monitor' },
];

export default function Account() {
  useDocumentTitle('Account');
  const { user, signOut } = useAuth();
  const { npcs } = useLibrary();
  const [theme, setTheme] = useTheme();
  const [signingOut, setSigningOut] = useState(false);
  const verified = Boolean(user.email_confirmed_at || user.confirmed_at);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  return (
    <div className="page content account">
      <header className="account-head">
        <UserAvatar email={user.email} size="lg" />
        <div>
          <h1 className="title-1">Account</h1>
          <p className="muted account-email">{user.email}</p>
        </div>
      </header>

      <section className="settings-group" aria-labelledby="acc-profile">
        <h2 id="acc-profile" className="section-title">
          Profile
        </h2>
        <dl className="settings-list">
          <div className="settings-row">
            <dt>Email</dt>
            <dd>
              <span className="account-email">{user.email}</span>
              {verified ? (
                <span className="badge badge-positive">
                  <Icon name="check" />
                  Verified
                </span>
              ) : (
                <span className="badge">Not verified</span>
              )}
            </dd>
          </div>
          {user.created_at && (
            <div className="settings-row">
              <dt>Member since</dt>
              <dd>{formatDate(user.created_at, { dateStyle: 'long' })}</dd>
            </div>
          )}
          {user.last_sign_in_at && (
            <div className="settings-row">
              <dt>Last signed in</dt>
              <dd>{formatDate(user.last_sign_in_at, { dateStyle: 'medium', timeStyle: 'short' })}</dd>
            </div>
          )}
          <div className="settings-row">
            <dt>Library</dt>
            <dd>
              {npcs ? (
                <Link to="/" className="link">
                  {plural(npcs.length, 'character')}
                </Link>
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="settings-group" aria-labelledby="acc-appearance">
        <h2 id="acc-appearance" className="section-title">
          Appearance
        </h2>
        <div className="settings-list">
          <div className="settings-row">
            <div>
              <p className="settings-label">Theme</p>
              <p className="field-hint">System follows your device’s setting.</p>
            </div>
            <Segmented label="Theme" options={THEMES} value={theme} onChange={setTheme} />
          </div>
        </div>
      </section>

      <section className="settings-group" aria-labelledby="acc-session">
        <h2 id="acc-session" className="section-title">
          Session
        </h2>
        <div className="settings-list">
          <div className="settings-row">
            <div>
              <p className="settings-label">Sign out on this device</p>
              <p className="field-hint">Your characters and conversations stay in your account.</p>
            </div>
            <button type="button" className="btn btn-secondary" onClick={handleSignOut} disabled={signingOut}>
              {signingOut ? <Spinner /> : <Icon name="logout" />}
              Sign out
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
