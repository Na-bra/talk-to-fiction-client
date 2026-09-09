import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import TraitPicker from '../components/TraitPicker.jsx';

const BLANK = {
  name: '', age: '', occupation: '', setting: '',
  personality: [], background: '', motivations: '', goals: '',
  fears: '', values: '', speechStyle: '', secrets: [''],
};

const LONG_FIELDS = [
  ['background', 'Background', 'Where they come from and what shaped them.'],
  ['motivations', 'Motivations', 'What drives them right now.'],
  ['goals', 'Goals', 'What they are actively trying to achieve.'],
  ['fears', 'Fears', 'What they are afraid of.'],
  ['values', 'Values', 'What they will not compromise on.'],
];

export default function NpcForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(BLANK);
  const [traits, setTraits] = useState([]);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.options().then((data) => setTraits(data.traits)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    api.getNpc(id).then((npc) =>
      setForm({
        ...BLANK,
        ...npc,
        age: npc.age ?? '',
        secrets: npc.secrets?.length ? npc.secrets.map((s) => s.content) : [''],
      }),
    );
  }, [id]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const setSecret = (index, value) =>
    setForm((prev) => ({
      ...prev,
      secrets: prev.secrets.map((secret, i) => (i === index ? value : secret)),
    }));

  const payload = () => ({
    ...form,
    age: form.age === '' ? undefined : Number(form.age),
    secrets: form.secrets.map((content) => content.trim()).filter(Boolean),
  });

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const draft = await api.generateDraft(payload());
      setForm({
        ...BLANK,
        ...draft,
        age: draft.age ?? '',
        secrets: draft.secrets?.length ? draft.secrets.map((s) => s.content) : [''],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const npc = id ? await api.updateNpc(id, payload()) : await api.createNpc(payload());
      navigate(`/npc/${npc._id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="page-head">
        <div>
          <span className="label">{id ? 'Edit' : 'New character'}</span>
          <h1>{id ? form.name || 'Edit character' : 'Create an NPC'}</h1>
        </div>
        <div className="spacer" />
        <button type="button" className="btn" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating…' : '✦ AI Generate Character'}
        </button>
      </div>

      {error && <div className="banner">{error}</div>}
      <p className="hint" style={{ marginTop: -14, marginBottom: 24 }}>
        Fill in what you know and let the generator complete the rest — anything you have already
        written is kept.
      </p>

      <div className="row">
        <div className="input-group">
          <span className="label">Name</span>
          <input type="text" value={form.name} onChange={set('name')} required />
        </div>
        <div className="input-group">
          <span className="label">Age</span>
          <input type="number" value={form.age} onChange={set('age')} min="0" />
        </div>
      </div>

      <div className="row">
        <div className="input-group">
          <span className="label">Occupation</span>
          <input type="text" value={form.occupation} onChange={set('occupation')} />
        </div>
        <div className="input-group">
          <span className="label">Setting / world</span>
          <input type="text" value={form.setting} onChange={set('setting')} />
        </div>
      </div>

      <div className="fieldset">
        <span className="label">Personality</span>
        <TraitPicker
          suggested={traits}
          selected={form.personality}
          onChange={(personality) => setForm((prev) => ({ ...prev, personality }))}
        />
      </div>

      <div className="fieldset">
        <span className="label">Character</span>
        {LONG_FIELDS.map(([key, label, hint]) => (
          <div className="input-group" key={key}>
            <span className="label">{label}</span>
            <textarea value={form[key]} onChange={set(key)} />
            <p className="hint">{hint}</p>
          </div>
        ))}

        <div className="input-group">
          <span className="label">Secrets</span>
          {form.secrets.map((secret, index) => (
            <div className="secret-row" key={index}>
              <input
                type="text"
                value={secret}
                placeholder="Something they know and would not admit"
                onChange={(event) => setSecret(index, event.target.value)}
              />
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    secrets: prev.secrets.filter((_, i) => i !== index).length
                      ? prev.secrets.filter((_, i) => i !== index)
                      : [''],
                  }))
                }
              >
                −
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setForm((prev) => ({ ...prev, secrets: [...prev.secrets, ''] }))}
          >
            + Add secret
          </button>
        </div>
      </div>

      <div className="fieldset">
        <div className="input-group">
          <span className="label">Speech style</span>
          <textarea value={form.speechStyle} onChange={set('speechStyle')} />
          <p className="hint">
            e.g. “Speaks briefly, uses dry humour, avoids directly answering personal questions.”
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 26 }}>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : id ? 'Save changes' : 'Create character'}
        </button>
        <Link to={id ? `/npc/${id}` : '/'} className="btn btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
