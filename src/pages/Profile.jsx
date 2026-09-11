import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import Field from '../components/Field.jsx';
import Relationship from '../components/Relationship.jsx';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [npc, setNpc] = useState(null);
  const [memories, setMemories] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getNpc(id).then(setNpc).catch((err) => setError(err.message));
    api.memories(id).then(setMemories).catch(() => {});
  }, [id]);

  async function handleDelete() {
    if (!window.confirm(`Delete ${npc.name}? This removes their conversations and memories.`)) return;
    await api.deleteNpc(id);
    navigate('/');
  }

  async function handleReset() {
    if (!window.confirm('Reset relationship, emotion, memories and conversations?')) return;
    setNpc(await api.resetNpc(id));
    setMemories([]);
  }

  if (error) return <div className="banner">{error}</div>;
  if (!npc) return <p className="thinking">Loading dossier…</p>;

  return (
    <>
      <div className="page-head">
        <div>
          <Link to="/" className="label">
            ← Registry
          </Link>
          <h1 className="dossier-name" style={{ margin: '10px 0 2px' }}>
            {npc.name}
          </h1>
          <div className="dossier-sub" style={{ marginBottom: 0 }}>
            {[npc.occupation, npc.age].filter(Boolean).join(' · ')}
            {npc.setting ? ` — ${npc.setting}` : ''}
          </div>
        </div>
        <div className="spacer" />
        <Link to={`/npc/${id}/chat`} className="btn btn-primary">
          Talk to {npc.name.split(' ')[0]}
        </Link>
      </div>

      <div className="dossier">
        <div>
          <div className="field">
            <span className="label">Personality</span>
            {npc.personality?.length ? (
              <div className="traits" style={{ marginTop: 8 }}>
                {npc.personality.map((trait) => (
                  <span className="trait on" key={trait}>
                    {trait}
                  </span>
                ))}
              </div>
            ) : (
              <p className="none">Not recorded.</p>
            )}
          </div>

          <Field label="Background" value={npc.background} />
          <Field label="Motivation" value={npc.motivations} />
          <Field label="Goals" value={npc.goals} />
          <Field label="Fears" value={npc.fears} />
          <Field label="Values" value={npc.values} />
          <Field label="Speech style" value={npc.speechStyle} />

          <div className="field">
            <span className="label">Secrets</span>
            {npc.secrets?.length ? (
              <div style={{ marginTop: 10 }}>
                {npc.secrets.map((secret) => (
                  <div className={`secret ${secret.knownByPlayer ? 'out' : ''}`} key={secret.id}>
                    <span className="tag">
                      {secret.knownByPlayer ? 'Revealed to player' : 'Known only to character'}
                    </span>
                    {secret.content}
                  </div>
                ))}
              </div>
            ) : (
              <p className="none">None.</p>
            )}
          </div>
        </div>

        <aside>
          <div className="panel">
            <span className="label">Emotional state</span>
            <div className="emotion">
              <b>{npc.emotionalState?.label}</b>
              <span>{npc.emotionalState?.intensity}/100</span>
            </div>
            {npc.emotionalState?.reason && <p className="emotion-why">{npc.emotionalState.reason}</p>}
          </div>

          <div className="panel">
            <span className="label">Relationship with player</span>
            <Relationship relationship={npc.relationship} />
          </div>

          <div className="panel">
            <span className="label">Long-term memory ({memories.length})</span>
            {memories.length === 0 && <p className="none" style={{ margin: 0, fontSize: 13.5 }}>Nothing remembered yet.</p>}
            {memories.map((memory) => (
              <div className="memory" key={memory.id}>
                <p>{memory.content}</p>
                {memory.npcInterpretation && <p className="interp">{memory.npcInterpretation}</p>}
                <div className="meta">
                  <span className={memory.importance === 'high' ? 'imp-high' : ''}>
                    {memory.importance}
                  </span>
                  {' · '}
                  {memory.source}
                  {' · '}
                  {new Date(memory.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Link to={`/npc/${id}/edit`} className="btn btn-sm">
              Edit
            </Link>
            <button className="btn btn-sm" onClick={handleReset}>
              Reset state
            </button>
            <button className="btn btn-sm btn-danger" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
