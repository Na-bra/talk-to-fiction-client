import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './styles.css';
import Gallery from './pages/Gallery.jsx';
import NpcForm from './pages/NpcForm.jsx';
import Profile from './pages/Profile.jsx';
import Chat from './pages/Chat.jsx';

function Layout({ children }) {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="wordmark">
            NPC <span>Registry</span>
          </Link>
          <span className="topbar-note">character database</span>
        </div>
      </header>
      <main className="shell">{children}</main>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/create" element={<NpcForm />} />
          <Route path="/npc/:id" element={<Profile />} />
          <Route path="/npc/:id/edit" element={<NpcForm />} />
          <Route path="/npc/:id/chat" element={<Chat />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </React.StrictMode>,
);
