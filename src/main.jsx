import React, { Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import './styles.css';
import { AuthProvider, useAuth } from './auth.jsx';
import { LibraryProvider } from './library.jsx';
import { ToastProvider } from './toast.jsx';
import { supabaseConfigured } from './supabase.js';
import AppShell from './components/AppShell.jsx';
import { Boot } from './components/ui.jsx';
import Gallery from './pages/Gallery.jsx';
import NpcForm from './pages/NpcForm.jsx';
import Dossier from './pages/Dossier.jsx';
import Chat from './pages/Chat.jsx';
import Login from './pages/Login.jsx';
import Account from './pages/Account.jsx';

/** Holds a page until the session is known, then shows it or sends the visitor to sign in. */
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Boot />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <AppShell>{children}</AppShell>;
}

function MissingConfig() {
  return (
    <div className="auth-simple">
      <div className="auth-simple-card card">
        <span className="brand-mark" aria-hidden="true">
          T
        </span>
        <h1 className="title-2">Not connected yet</h1>
        <p className="muted">
          This client needs a Supabase project. Set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in <code>.env</code>, then restart{' '}
          <code>npm run dev</code>.
        </p>
      </div>
    </div>
  );
}

/** Remounts a page when its :id changes, so one character's state never leaks into the next. */
function Keyed({ children }) {
  const { id } = useParams();
  return <Fragment key={id}>{children}</Fragment>;
}

const guard = (page) => <RequireAuth>{page}</RequireAuth>;
const guardKeyed = (page) => guard(<Keyed>{page}</Keyed>);

function App() {
  if (!supabaseConfigured) return <MissingConfig />;
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={guard(<Gallery />)} />
      <Route path="/create" element={guard(<NpcForm />)} />
      <Route path="/account" element={guard(<Account />)} />
      <Route path="/npc/:id" element={guardKeyed(<Dossier />)} />
      <Route path="/npc/:id/edit" element={guardKeyed(<NpcForm />)} />
      <Route path="/npc/:id/chat" element={guardKeyed(<Chat />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LibraryProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </LibraryProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
