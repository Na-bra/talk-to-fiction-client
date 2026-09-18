import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { useLibrary } from '../library.jsx';
import { useToast } from '../toast.jsx';
import Icon from '../components/Icon.jsx';
import TraitPicker from '../components/TraitPicker.jsx';
import { Banner, EmptyState, Skeleton, Spinner } from '../components/ui.jsx';
import { firstName } from '../lib/format.js';
import { useAutoGrow, useDocumentTitle } from '../lib/hooks.js';

const BLANK = {
  name: '', age: '', occupation: '', setting: '',
  personality: [], background: '', motivations: '', goals: '',
  fears: '', values: '', speechStyle: '', secrets: [''],
};

const STORY_FIELDS = [
  ['background', 'Background', 'Where they come from and what shaped them.', 6],
  ['motivations', 'Motivations', 'What drives them right now.', 3],
  ['goals', 'Goals', 'What they are actively trying to achieve.', 3],
  ['fears', 'Fears', 'What they are afraid of.', 3],
  ['values', 'Values', 'What they will not compromise on.', 3],
];

const SECTIONS = [
  ['identity', 'Identity'],
  ['personality', 'Personality'],
  ['story', 'Story'],
  ['voice', 'Voice'],
  ['secrets', 'Secrets'],
];

const toForm = (npc) => ({
  ...BLANK,
  ...npc,
  age: npc.age ?? '',
  secrets: npc.secrets?.length ? npc.secrets.map((s) => s.content) : [''],
});

function AutoTextarea({ rows = 3, className = 'textarea', ...props }) {
  const ref = useRef(null);
  useAutoGrow(ref, props.value, 520);
  return <textarea ref={ref} rows={rows} className={className} {...props} />;
}

function FormSection({ id, title, icon, description, className = '', children }) {
  return (
    <section id={id} className={`form-section ${className}`} aria-labelledby={`${id}-heading`}>
      <header className="form-section-head">
        <h2 id={`${id}-heading`}>
          {icon && <Icon name={icon} />}
          {title}
        </h2>
        {description && <p>{description}</p>}
      </header>
      {children}
    </section>
  );
}

/** Highlights the section currently in view in the side index. */
function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -70% 0px' },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

const SECTION_IDS = SECTIONS.map(([id]) => id);

export default function NpcForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { upsert } = useLibrary();
  const [form, setForm] = useState(BLANK);
  const [revealed, setRevealed] = useState(() => new Set());
  const [traits, setTraits] = useState([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const active = useActiveSection(SECTION_IDS);
  useDocumentTitle(id ? `Edit ${form.name || 'character'}` : 'New character');

  useEffect(() => {
    api.options().then((data) => setTraits(data.traits)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    api
      .getNpc(id)
      .then((npc) => {
        setForm(toForm(npc));
        setRevealed(new Set((npc.secrets || []).filter((s) => s.knownByPlayer).map((s) => s.content)));
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const setSecret = (index, value) =>
    setForm((prev) => ({
      ...prev,
      secrets: prev.secrets.map((secret, i) => (i === index ? value : secret)),
    }));

  const removeSecret = (index) =>
    setForm((prev) => {
      const rest = prev.secrets.filter((_, i) => i !== index);
      return { ...prev, secrets: rest.length ? rest : [''] };
    });

  const payload = () => ({
    ...form,
    age: form.age === '' ? undefined : Number(form.age),
    secrets: form.secrets.map((content) => content.trim()).filter(Boolean),
  });

  const hasContent = Object.entries(form).some(([, value]) =>
    Array.isArray(value) ? value.some((item) => `${item}`.trim()) : `${value}`.trim(),
  );

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const draft = await api.generateDraft(payload());
      setForm(toForm(draft));
      toast('Draft ready. Read it through before saving.');
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
      upsert(npc);
      toast(id ? 'Changes saved' : `${npc.name} joined your library`);
      // A new character gets its first portrait when the dossier opens.
      navigate(`/npc/${npc.id}`, { state: { drawPortrait: !id } });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="page content">
        <EmptyState
          icon="alert"
          title="This character couldn’t be loaded"
          actions={
            <Link to="/" className="btn btn-secondary">
              <Icon name="arrowLeft" />
              Back to library
            </Link>
          }
        >
          {loadError}
        </EmptyState>
      </div>
    );
  }

  const name = form.name.trim();
  const first = name ? firstName(name) : 'they';
  const backTo = id ? `/npc/${id}` : '/';

  return (
    <div className="page content">
      <div className="editor">
        <nav className="editor-index" aria-label="Form sections">
          {SECTIONS.map(([key, label]) => (
            <a key={key} href={`#${key}`} className={active === key ? 'is-active' : ''} aria-current={active === key ? 'true' : undefined}>
              {label}
            </a>
          ))}
        </nav>

        <form className="editor-form" onSubmit={handleSubmit}>
          <header className="editor-head">
            <Link to={backTo} className="crumb">
              <Icon name="arrowLeft" />
              {id ? name || 'Dossier' : 'Library'}
            </Link>
            <h1 className="title-1">{id ? 'Edit character' : 'New character'}</h1>
            <p className="muted">
              {id
                ? 'Changes shape how they speak from the next message on.'
                : 'A name is all you need to begin. Everything else can come later.'}
            </p>
          </header>

          <div className="draft-card">
            <span className="draft-icon">
              <Icon name="sparkle" />
            </span>
            <div className="draft-text">
              <h2>Draft with AI</h2>
              <p>
                Fill in what you know, and the generator writes the rest. Anything you’ve already
                written is kept.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleGenerate}
              disabled={generating || busy || loading}
            >
              {generating ? <Spinner /> : <Icon name="sparkle" />}
              {generating ? 'Drafting…' : hasContent ? 'Complete draft' : 'Generate a character'}
            </button>
          </div>

          {error && (
            <div className="editor-error">
              <Banner onDismiss={() => setError('')}>{error}</Banner>
            </div>
          )}

          {loading ? (
            <div className="form-section" aria-busy="true" aria-label="Loading character">
              <div style={{ display: 'grid', gap: 14 }}>
                <Skeleton width={120} height={14} />
                <Skeleton height={42} />
                <Skeleton height={42} />
                <Skeleton height={120} />
              </div>
            </div>
          ) : (
            <fieldset className="editor-fields" disabled={generating} aria-busy={generating}>
              <FormSection id="identity" title="Identity" description="Who they are, at a glance.">
                <div className="form-grid">
                  <div className="field span-4">
                    <label className="field-label" htmlFor="f-name">
                      Name
                    </label>
                    <input
                      id="f-name"
                      type="text"
                      className="input"
                      value={form.name}
                      onChange={set('name')}
                      maxLength={120}
                      autoComplete="off"
                      required
                      autoFocus={!id}
                    />
                  </div>
                  <div className="field span-2">
                    <label className="field-label" htmlFor="f-age">
                      Age <span className="optional">(optional)</span>
                    </label>
                    <input
                      id="f-age"
                      type="number"
                      className="input"
                      value={form.age}
                      onChange={set('age')}
                      min="0"
                      max="5000"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="field span-6">
                    <label className="field-label" htmlFor="f-occupation">
                      Occupation
                    </label>
                    <input
                      id="f-occupation"
                      type="text"
                      className="input"
                      value={form.occupation}
                      onChange={set('occupation')}
                      placeholder="Detective, ferryman, disgraced court astronomer…"
                    />
                  </div>
                  <div className="field span-6">
                    <label className="field-label" htmlFor="f-setting">
                      Setting or world
                    </label>
                    <AutoTextarea
                      id="f-setting"
                      rows={2}
                      value={form.setting}
                      onChange={set('setting')}
                      placeholder="Where and when their story takes place."
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection
                id="personality"
                title="Personality"
                description="Pick the traits that colour how they talk and react."
              >
                <TraitPicker
                  suggested={traits}
                  selected={form.personality}
                  onChange={(personality) => setForm((prev) => ({ ...prev, personality }))}
                />
              </FormSection>

              <FormSection id="story" title="Story" description="The history and wants that sit behind every answer.">
                <div className="form-stack">
                  {STORY_FIELDS.map(([key, label, hint, rows]) => (
                    <div className="field" key={key}>
                      <label className="field-label" htmlFor={`f-${key}`}>
                        {label}
                      </label>
                      <AutoTextarea
                        id={`f-${key}`}
                        rows={rows}
                        className={`textarea ${key === 'background' ? 'prose' : ''}`}
                        value={form[key]}
                        onChange={set(key)}
                        aria-describedby={`f-${key}-hint`}
                      />
                      <p className="field-hint" id={`f-${key}-hint`}>
                        {hint}
                      </p>
                    </div>
                  ))}
                </div>
              </FormSection>

              <FormSection id="voice" title="Voice" description="How they sound when they speak.">
                <div className="field">
                  <label className="field-label" htmlFor="f-speech">
                    Speech style
                  </label>
                  <AutoTextarea
                    id="f-speech"
                    rows={3}
                    className="textarea prose"
                    value={form.speechStyle}
                    onChange={set('speechStyle')}
                    aria-describedby="f-speech-hint"
                  />
                  <p className="field-hint" id="f-speech-hint">
                    e.g. “Speaks briefly, uses dry humour, avoids directly answering personal questions.”
                  </p>
                </div>
              </FormSection>

              <FormSection
                id="secrets"
                title="Secrets"
                icon="lock"
                className="is-private"
                description={
                  name
                    ? `Things ${first} knows and would not admit. Secrets start hidden, and are only revealed if ${first} chooses to tell you in conversation.`
                    : 'Things they know and would not admit. Secrets start hidden, and are only revealed if they choose to tell you in conversation.'
                }
              >
                <ol className="secret-fields">
                  {form.secrets.map((secret, index) => (
                    <li className="secret-field" key={index}>
                      <span className="secret-index" aria-hidden="true">
                        {index + 1}
                      </span>
                      <div className="secret-input">
                        <AutoTextarea
                          rows={1}
                          value={secret}
                          aria-label={`Secret ${index + 1}`}
                          placeholder="Something they know and would not admit"
                          onChange={(event) => setSecret(index, event.target.value)}
                        />
                        {revealed.has(secret.trim()) && (
                          <span className="badge badge-accent">
                            <Icon name="unlock" />
                            Already revealed to you
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => removeSecret(index)}
                        aria-label={`Remove secret ${index + 1}`}
                        data-tip="Remove"
                      >
                        <Icon name="trash" />
                      </button>
                    </li>
                  ))}
                </ol>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm secret-add"
                  onClick={() => setForm((prev) => ({ ...prev, secrets: [...prev.secrets, ''] }))}
                >
                  <Icon name="plus" />
                  Add a secret
                </button>
              </FormSection>
            </fieldset>
          )}

          <div className="editor-actions">
            <p className="hide-sm">
              {id ? 'Relationship, mood and memories are kept.' : 'You can change everything later.'}
            </p>
            <Link to={backTo} className="btn btn-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={busy || generating || loading}>
              {busy && <Spinner />}
              {busy ? 'Saving…' : id ? 'Save changes' : 'Create character'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
