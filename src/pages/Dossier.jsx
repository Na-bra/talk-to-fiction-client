import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useLibrary } from '../library.jsx';
import { useToast } from '../toast.jsx';
import Icon from '../components/Icon.jsx';
import Menu from '../components/Menu.jsx';
import Meter from '../components/Meter.jsx';
import Relationship from '../components/Relationship.jsx';
import { ConfirmDialog } from '../components/Dialog.jsx';
import { Avatar, EmptyState, Mood, Skeleton, Spinner, Stage } from '../components/ui.jsx';
import { firstName, formatDate, identityLine, relativeTime } from '../lib/format.js';
import { useDocumentTitle } from '../lib/hooks.js';

const DRIVES = [
  ['motivations', 'Motivation'],
  ['goals', 'Goals'],
  ['fears', 'Fears'],
  ['values', 'Values'],
];

const SOURCE = { conversation: 'From a conversation', manual: 'Added by hand', seed: 'Part of their history' };

const NotWritten = () => <p className="none">Not written yet.</p>;

function Section({ id, title, icon, aside, children }) {
  return (
    <section className="dossier-section" aria-labelledby={`${id}-title`}>
      <header className="dossier-section-head">
        <h2 id={`${id}-title`} className="section-title">
          {icon && <Icon name={icon} />}
          {title}
        </h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

/** Long prose folds after a few paragraphs, with a toggle to read the rest. */
function Prose({ text }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 720;
  return (
    <div>
      <p className={`dossier-lead ${long && !open ? 'is-clamped' : ''}`}>{text}</p>
      {long && (
        <button type="button" className="link dossier-more" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

function Memories({ memories, name }) {
  const [all, setAll] = useState(false);
  if (!memories) {
    return (
      <div style={{ display: 'grid', gap: 10 }} aria-hidden="true">
        <Skeleton height={14} />
        <Skeleton width="80%" height={14} />
      </div>
    );
  }
  if (!memories.length) {
    return <p className="none">Nothing remembered yet. Memories form as you talk with {name}.</p>;
  }
  const shown = all ? memories : memories.slice(0, 4);
  return (
    <>
      <ol className="memory-list">
        {shown.map((memory) => (
          <li className="memory" key={memory.id}>
            <p>{memory.content}</p>
            {memory.npcInterpretation && (
              <p className="memory-interp">
                <span className="sr-only">How {name} took it: </span>
                {memory.npcInterpretation}
              </p>
            )}
            <p className="memory-meta">
              <span className={`badge ${memory.importance === 'high' ? 'badge-accent' : ''}`}>
                {memory.importance[0].toUpperCase() + memory.importance.slice(1)} importance
              </span>
              <span>{SOURCE[memory.source] || memory.source}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={memory.createdAt}>{formatDate(memory.createdAt)}</time>
            </p>
          </li>
        ))}
      </ol>
      {memories.length > 4 && (
        <button type="button" className="btn btn-ghost btn-sm dossier-show-all" onClick={() => setAll(!all)}>
          {all ? 'Show fewer' : `Show all ${memories.length} memories`}
          <Icon name="chevronDown" style={{ transform: all ? 'rotate(180deg)' : undefined }} />
        </button>
      )}
    </>
  );
}

function DossierSkeleton() {
  return (
    <div className="page content dossier" aria-busy="true" aria-label="Loading dossier">
      <Skeleton width={90} height={14} />
      <div className="dossier-hero">
        <Skeleton width={112} height={112} radius="28%" />
        <div style={{ display: 'grid', gap: 12 }}>
          <Skeleton width={160} height={14} />
          <Skeleton width="min(420px, 80%)" height={44} />
          <Skeleton width="min(360px, 70%)" height={18} />
        </div>
      </div>
      <div style={{ display: 'grid', gap: 10, maxWidth: 680 }}>
        <Skeleton height={16} />
        <Skeleton height={16} />
        <Skeleton width="72%" height={16} />
      </div>
    </div>
  );
}

export default function Dossier() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { upsert, remove } = useLibrary();
  const [npc, setNpc] = useState(null);
  const [memories, setMemories] = useState(null);
  const [goals, setGoals] = useState(null);
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const autoDrawn = useRef(false);
  useDocumentTitle(npc?.name);

  useEffect(() => {
    let live = true;
    api
      .getNpc(id)
      .then((data) => {
        if (!live) return;
        setNpc(data);
        // A character created a moment ago gets its first portrait on arrival.
        if (location.state?.drawPortrait && !data.portraitUrl && !autoDrawn.current) {
          autoDrawn.current = true;
          navigate('.', { replace: true, state: null }); // so a refresh does not draw again
          drawPortrait();
        }
      })
      .catch((err) => live && setError(err.message));
    api
      .memories(id)
      .then((data) => live && setMemories(data))
      .catch(() => live && setMemories([]));
    // Goals need a migration; before it is run this simply stays empty.
    api
      .goals(id)
      .then((data) => live && setGoals(data))
      .catch(() => live && setGoals([]));
    return () => {
      live = false;
    };
    // Loads once per character. The arrival state that triggers the first
    // portrait is only meaningful at that moment, so it is not a dependency.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDelete() {
    await api.deleteNpc(id);
    remove(id);
    toast(`${npc.name} was deleted`);
    navigate('/');
  }

  async function drawPortrait() {
    setDrawing(true);
    try {
      const updated = await api.generatePortrait(id);
      setNpc(updated);
      upsert(updated);
      toast(`New portrait of ${firstName(updated.name)}`);
    } catch (err) {
      toast(err.message);
    } finally {
      setDrawing(false);
    }
  }

  async function planTheirGoals() {
    setPlanning(true);
    try {
      setGoals(await api.planGoals(id));
      toast(`Worked out what ${firstName(npc.name)} is chasing`);
    } catch (err) {
      toast(err.message);
    } finally {
      setPlanning(false);
    }
  }

  async function setGoalStatus(goal, status) {
    const updated = await api.updateGoal(id, goal.id, { status });
    setGoals((current) => current.map((item) => (item.id === goal.id ? updated : item)));
  }

  async function removeGoal(goal) {
    await api.deleteGoal(id, goal.id);
    setGoals((current) => current.filter((item) => item.id !== goal.id));
    toast('Goal removed');
  }

  async function handleReset() {
    const updated = await api.resetNpc(id);
    setNpc(updated);
    upsert(updated);
    setMemories([]);
    toast('Relationship, mood and memories reset');
  }

  if (error) {
    return (
      <div className="page content">
        <EmptyState
          icon="alert"
          title="This dossier couldn’t be opened"
          actions={
            <Link to="/" className="btn btn-secondary">
              <Icon name="arrowLeft" />
              Back to library
            </Link>
          }
        >
          {error}
        </EmptyState>
      </div>
    );
  }

  if (!npc) return <DossierSkeleton />;

  const first = firstName(npc.name);
  const identity = identityLine(npc);
  const secrets = npc.secrets || [];
  const revealed = secrets.filter((secret) => secret.knownByPlayer).length;
  const emotion = npc.emotionalState || {};

  return (
    <div className="page content dossier">
      <Link to="/" className="crumb">
        <Icon name="arrowLeft" />
        Library
      </Link>

      <header className="dossier-hero">
        <div className="dossier-portrait">
          <Avatar name={npc.name} size="xl" src={npc.portraitUrl} />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={drawPortrait}
            disabled={drawing}
            aria-busy={drawing}
          >
            {drawing ? <Spinner /> : <Icon name="sparkle" />}
            {drawing ? 'Drawing…' : npc.portraitUrl ? 'Redraw portrait' : 'Draw portrait'}
          </button>
        </div>
        <div className="dossier-id">
          {identity && <p className="dossier-kicker">{identity}</p>}
          <h1 className="display">{npc.name}</h1>
          {npc.relationshipStage && (
            <p className="dossier-standing">
              <Stage stage={npc.relationshipStage} />
            </p>
          )}
          {npc.setting && <p className="dossier-setting">{npc.setting}</p>}
          {npc.personality?.length > 0 && (
            <ul className="chips dossier-traits" aria-label="Personality">
              {npc.personality.map((trait) => (
                <li className="chip chip-lg" key={trait}>
                  {trait}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="dossier-actions">
          <Link to={`/npc/${id}/chat`} className="btn btn-primary btn-lg">
            <Icon name="chat" />
            Talk to {first}
          </Link>
          <Link to={`/npc/${id}/edit`} className="btn btn-secondary btn-lg">
            <Icon name="edit" />
            Edit
          </Link>
          <Menu
            label="More actions"
            tip="More"
            items={[
              { label: 'Reset state…', icon: 'reset', onSelect: () => setConfirm('reset') },
              'separator',
              { label: 'Delete character…', icon: 'trash', danger: true, onSelect: () => setConfirm('delete') },
            ]}
          />
        </div>
      </header>

      <div className="dossier-grid">
        <aside className="dossier-aside" aria-label="Current state">
          <section className="card card-pad" aria-labelledby="now-title">
            <h2 id="now-title" className="section-title">
              Right now
            </h2>
            <div className="state-mood">
              <Mood state={emotion} large />
            </div>
            <Meter label="Intensity" value={emotion.intensity ?? 0} />
            {emotion.reason && <p className="emotion-reason">{emotion.reason}</p>}
          </section>

          <section className="card card-pad" aria-labelledby="rel-title">
            <h2 id="rel-title" className="section-title" style={{ marginBottom: 16 }}>
              Relationship with you
            </h2>
            <Relationship relationship={npc.relationship} />
          </section>

          <p className="dossier-meta">
            Created {formatDate(npc.createdAt)}
            {npc.updatedAt && <> · Updated {relativeTime(npc.updatedAt)}</>}
          </p>
        </aside>

        <div className="dossier-main">
          <Section id="background" title="Background">
            {npc.background ? <Prose text={npc.background} /> : <NotWritten />}
          </Section>

          <Section id="drives" title="What drives them">
            <dl className="drives">
              {DRIVES.map(([key, label]) => (
                <div className="drive" key={key}>
                  <dt>{label}</dt>
                  <dd className={npc[key] ? '' : 'none'}>{npc[key] || 'Not written yet.'}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section
            id="goals"
            title="What they're working on"
            icon="compass"
            aside={
              goals?.length > 0 && (
                <span className="section-aside">
                  {goals.filter((goal) => goal.status === 'active').length} active
                </span>
              )
            }
          >
            {goals === null && <Skeleton height={16} />}
            {goals?.length === 0 && (
              <div className="goal-empty">
                <p className="none">Nothing written down yet.</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={planTheirGoals}
                  disabled={planning}
                  aria-busy={planning}
                >
                  {planning ? <Spinner /> : <Icon name="compass" />}
                  {planning ? 'Reading their file…' : `Work out what ${first} is chasing`}
                </button>
              </div>
            )}
            {goals?.length > 0 && (
              <ul className="goal-list">
                {goals.map((goal) => (
                  <li className={`goal ${goal.status === 'active' ? '' : 'is-closed'}`} key={goal.id}>
                    <div className="goal-head">
                      <h3>{goal.title}</h3>
                      <Menu
                        label={`Actions for ${goal.title}`}
                        tip="More"
                        items={[
                          goal.status === 'active'
                            ? { label: 'Mark achieved', icon: 'check', onSelect: () => setGoalStatus(goal, 'achieved') }
                            : { label: 'Make active again', icon: 'reset', onSelect: () => setGoalStatus(goal, 'active') },
                          goal.status === 'active' && {
                            label: 'Give up on it', icon: 'close', onSelect: () => setGoalStatus(goal, 'abandoned'),
                          },
                          'separator',
                          { label: 'Remove', icon: 'trash', danger: true, onSelect: () => removeGoal(goal) },
                        ].filter(Boolean)}
                      />
                    </div>
                    <Meter
                      label={goal.status === 'active' ? 'Progress' : goal.status === 'achieved' ? 'Achieved' : 'Given up'}
                      value={goal.progress}
                    />
                    {goal.currentObjective && (
                      <p className="goal-line">
                        <Icon name="chevronRight" />
                        {goal.currentObjective}
                      </p>
                    )}
                    {goal.obstacle && (
                      <p className="goal-line goal-blocked">
                        <Icon name="alert" />
                        {goal.obstacle}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section id="voice" title="Voice">
            {npc.speechStyle ? (
              <blockquote className="voice">
                <Icon name="quote" />
                <p>{npc.speechStyle}</p>
              </blockquote>
            ) : (
              <NotWritten />
            )}
          </Section>

          <section className="private-file" aria-labelledby="private-title">
            <header className="private-head">
              <span className="private-icon">
                <Icon name="lock" />
              </span>
              <div>
                <h2 id="private-title">Private file</h2>
                <p>The secrets {first} is keeping, and what {first} remembers of you.</p>
              </div>
            </header>

            <Section
              id="secrets"
              title="Secrets"
              aside={secrets.length > 0 && <span className="section-aside">{revealed} of {secrets.length} revealed</span>}
            >
              {secrets.length ? (
                <ul className="secret-list">
                  {secrets.map((secret) => (
                    <li className={`secret ${secret.knownByPlayer ? 'is-revealed' : ''}`} key={secret.id}>
                      {secret.knownByPlayer ? (
                        <span className="badge badge-accent">
                          <Icon name="unlock" />
                          Revealed to you{secret.revealedAt ? ` · ${formatDate(secret.revealedAt)}` : ''}
                        </span>
                      ) : (
                        <span className="badge">
                          <Icon name="lock" />
                          Still hidden
                        </span>
                      )}
                      <p>{secret.content}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="none">No secrets. {first} has nothing to hide — yet.</p>
              )}
            </Section>

            <Section
              id="memories"
              title="Memories"
              aside={memories?.length > 0 && <span className="section-aside">{memories.length}</span>}
            >
              <Memories memories={memories} name={first} />
            </Section>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === 'reset'}
        onClose={() => setConfirm(null)}
        icon="reset"
        title={`Reset ${first}’s state?`}
        description="Relationship, mood and memories return to their defaults, secrets become hidden again, and every conversation is deleted. The character sheet stays as it is."
        confirmLabel="Reset state"
        danger
        onConfirm={handleReset}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        icon="trash"
        title={`Delete ${npc.name}?`}
        description="This permanently removes the character, along with their conversations and memories. It can’t be undone."
        confirmLabel="Delete character"
        danger
        onConfirm={handleDelete}
      />
    </div>
  );
}
