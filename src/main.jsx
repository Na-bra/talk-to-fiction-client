import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import './styles.css';
import { AuthProvider, useAuth } from './auth.jsx';
import { supabaseConfigured } from './supabase.js';
import Gallery from './pages/Gallery.jsx';
import NpcForm from './pages/NpcForm.jsx';
import Profile from './pages/Profile.jsx';
import Chat from './pages/Chat.jsx';
import Login from './pages/Login.jsx';

function Layout({ children }) {
  const { user, signOut } = useAuth();
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="wordmark">
            NPC <span>Registry</span>
          </Link>
          {user ? (
            <div className="topbar-user">
              <span className="topbar-note">{user.email}</span>
              <button type="button" className="btn btn-sm btn-ghost" onClick={signOut}>
                Sign out
              </button>
            </div>
          ) : (
            <span className="topbar-note">character database</span>
          )}
        </div>
      </header>
      <main className="shell">{children}</main>
    </>
  );
}

/** Holds a page until the session is known, then shows it or sends the visitor to sign in. */
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="thinking">Loading…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function MissingConfig() {
  return (
    <div className="empty">
      <p>This client is not connected to Supabase.</p>
      <p className="auth-lede">
        Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in{' '}
        <code>.env</code>, then restart <code>npm run dev</code>.
      </p>
    </div>
  );
}

const guard = (page) => <RequireAuth>{page}</RequireAuth>;

function App() {
  return (
    <Layout>
      {supabaseConfigured ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={guard(<Gallery />)} />
          <Route path="/create" element={guard(<NpcForm />)} />
          <Route path="/npc/:id" element={guard(<Profile />)} />
          <Route path="/npc/:id/edit" element={guard(<NpcForm />)} />
          <Route path="/npc/:id/chat" element={guard(<Chat />)} />
        </Routes>
      ) : (
        <MissingConfig />
      )}
    </Layout>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
