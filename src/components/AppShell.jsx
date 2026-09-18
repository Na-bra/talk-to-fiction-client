import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useLibrary } from '../library.jsx';
import Icon from './Icon.jsx';
import { Avatar, Skeleton, UserAvatar } from './ui.jsx';

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Talk to Fiction — library">
      <span className="brand-mark" aria-hidden="true">
        T
      </span>
      Talk to Fiction
    </Link>
  );
}

function CharacterNav() {
  const { npcs } = useLibrary();
  return (
    <div className="sidebar-section">
      <div className="sidebar-heading" id="sidebar-characters">
        <span>Characters</span>
        {npcs?.length > 0 && <span className="tabular">{npcs.length}</span>}
      </div>
      <nav className="sidebar-list" aria-labelledby="sidebar-characters">
        {!npcs &&
          [0, 1, 2].map((row) => (
            <div className="char-link" key={row} aria-hidden="true">
              <Skeleton width={32} height={32} radius="50%" />
              <Skeleton width={`${70 - row * 12}%`} height={12} />
            </div>
          ))}
        {npcs?.length === 0 && <p className="sidebar-note">No characters yet.</p>}
        {npcs?.map((npc) => (
          <NavLink key={npc.id} to={`/npc/${npc.id}`} className="char-link">
            <Avatar name={npc.name} src={npc.portraitUrl} size="sm" />
            <span className="char-link-text">
              <span className="char-link-name">{npc.name}</span>
              {npc.occupation && <span className="char-link-sub">{npc.occupation}</span>}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function AppShell({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  // Chat takes the whole viewport on small screens, with its own header.
  const immersive = pathname.endsWith('/chat');

  return (
    <div className={`app ${immersive ? 'is-immersive' : ''}`}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <aside className="sidebar">
        <Brand />
        <nav className="nav" aria-label="Primary">
          <NavLink to="/" end className="nav-link">
            <Icon name="book" />
            Library
          </NavLink>
          <NavLink to="/create" className="nav-link">
            <Icon name="plus" />
            New character
          </NavLink>
        </nav>
        <CharacterNav />
        <div className="sidebar-foot">
          <NavLink to="/account" className="account-link">
            <UserAvatar email={user?.email} />
            <span className="account-link-text">
              <b>Account</b>
              <span>{user?.email}</span>
            </span>
            <Icon name="chevronRight" />
          </NavLink>
        </div>
      </aside>

      <header className="mobile-bar">
        <Brand />
        <Link to="/account" className="account-mini" aria-label="Account">
          <UserAvatar email={user?.email} />
        </Link>
      </header>

      <main id="main" className="main" tabIndex={-1}>
        {children}
      </main>

      <nav className="tabbar" aria-label="Primary">
        <NavLink to="/" end className="tab">
          <Icon name="book" />
          Library
        </NavLink>
        <NavLink to="/create" className="tab">
          <Icon name="plus" />
          Create
        </NavLink>
        <NavLink to="/account" className="tab">
          <Icon name="user" />
          Account
        </NavLink>
      </nav>
    </div>
  );
}
