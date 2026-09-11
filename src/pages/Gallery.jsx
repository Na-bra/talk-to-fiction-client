import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export default function Gallery() {
  const [npcs, setNpcs] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.listNpcs().then(setNpcs).catch((err) => setError(err.message));
  }, []);

  const addSample = async () => {
    setAdding(true);
    setError('');
    try {
      const npc = await api.createSample();
      setNpcs((current) => [npc, ...(current || [])]);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <span className="label">Registry</span>
          <h1>Characters</h1>
        </div>
        <div className="spacer" />
        <Link to="/create" className="btn btn-primary">
          + Create NPC
        </Link>
      </div>

      {error && <div className="banner">{error}</div>}
      {!npcs && !error && <p className="thinking">Loading…</p>}

      {npcs && npcs.length === 0 && (
        <div className="empty">
          <p>No characters yet.</p>
          <div className="empty-actions">
            <Link to="/create" className="btn btn-primary">
              Create your first NPC
            </Link>
            <button type="button" className="btn" onClick={addSample} disabled={adding}>
              {adding ? 'Adding…' : 'Add Kevin Cross (sample)'}
            </button>
          </div>
        </div>
      )}

      {npcs && npcs.length > 0 && (
        <div className="grid">
          {npcs.map((npc) => (
            <article className="card" key={npc.id}>
              <div className="card-head">
                <div className="avatar">{initials(npc.name)}</div>
                <div>
                  <h3>{npc.name}</h3>
                  <div className="sub">
                    {[npc.occupation, npc.age].filter(Boolean).join(' · ') || 'Unspecified'}
                  </div>
                </div>
              </div>

              {npc.personality?.length > 0 && (
                <div className="traits">
                  {npc.personality.slice(0, 4).map((trait) => (
                    <span className="trait" key={trait}>
                      {trait}
                    </span>
                  ))}
                </div>
              )}

              <p className="blurb">{npc.background || npc.motivations || 'No background recorded.'}</p>

              <div className="foot">
                <Link to={`/npc/${npc.id}`} className="btn btn-sm">
                  Open dossier
                </Link>
                <Link to={`/npc/${npc.id}/chat`} className="btn btn-sm btn-ghost">
                  Talk
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
