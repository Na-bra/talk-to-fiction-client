import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useLibrary } from '../library.jsx';
import Icon from '../components/Icon.jsx';
import Meter from '../components/Meter.jsx';
import Relationship from '../components/Relationship.jsx';
import { Sheet } from '../components/Dialog.jsx';
import { Avatar, Banner, EmptyState, Mood, Skeleton } from '../components/ui.jsx';
import { RELATIONSHIP_AXES, firstName, formatDate, identityLine, plural, relativeTime } from '../lib/format.js';
import { useAutoGrow, useDocumentTitle, useMediaQuery } from '../lib/hooks.js';

/** Renders *asterisk* spans as emphasis so stage directions read differently. */
function Dialogue({ text }) {
  return text.split(/(\*[^*]+\*)/g).map((part, index) =>
    part.startsWith('*') && part.endsWith('*') && part.length > 2 ? (
      <em key={index}>{part.slice(1, -1)}</em>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

/** What a reply changed: relationship moves, a new mood, a secret told, a memory kept. */
function ShiftNote({ changes, newMemories, name }) {
  const moved = RELATIONSHIP_AXES.map((axis) => ({
    ...axis,
    value: changes?.relationshipChange?.[axis.key] || 0,
  })).filter((axis) => axis.value !== 0);
  const revealed = changes?.revealedSecrets?.length || 0;
  const remembered = newMemories?.length || 0;
  if (!moved.length && !changes?.emotionChanged && !revealed && !remembered) return null;

  return (
    <div className="shift" role="note" aria-label="What changed">
      {moved.map((axis) => (
        <span key={axis.key} className={`shift-item ${axis.value > 0 !== axis.caution ? 'is-good' : 'is-bad'}`}>
          {axis.label} {axis.value > 0 ? '+' : '−'}
          {Math.abs(axis.value)}
        </span>
      ))}
      {changes?.emotionChanged && (
        <span className="shift-item">Now {changes.emotionalState.label.toLowerCase()}</span>
      )}
      {revealed > 0 && (
        <span className="shift-item is-secret">
          <Icon name="unlock" />
          {revealed === 1 ? 'Told you a secret' : `Told you ${revealed} secrets`}
        </span>
      )}
      {remembered > 0 && (
        <span className="shift-item">
          <Icon name="bookmark" />
          {name} will remember this
        </span>
      )}
    </div>
  );
}

function CharacterState({ npc, lastChanges }) {
  const emotion = npc.emotionalState || {};
  const secrets = npc.secrets || [];
  const revealed = secrets.filter((secret) => secret.knownByPlayer).length;
  return (
    <div className="state">
      <section className="state-block" aria-labelledby="state-mood">
        <h3 id="state-mood" className="section-title">
          Mood
        </h3>
        <div className="state-mood">
          <Mood state={emotion} large />
        </div>
        <Meter label="Intensity" value={emotion.intensity ?? 0} />
        {emotion.reason && <p className="emotion-reason">{emotion.reason}</p>}
      </section>

      <section className="state-block" aria-labelledby="state-rel">
        <h3 id="state-rel" className="section-title">
          Relationship with you
        </h3>
        <Relationship relationship={npc.relationship} deltas={lastChanges?.relationshipChange} />
      </section>

      {secrets.length > 0 && (
        <section className="state-block" aria-labelledby="state-secrets">
          <h3 id="state-secrets" className="section-title">
            Secrets
          </h3>
          <p className="muted state-note">
            {revealed === 0 ? 'None told yet' : `${revealed} of ${secrets.length} told to you`}
          </p>
          <div className="secret-dots" aria-hidden="true">
            {secrets.map((secret) => (
              <i key={secret.id} className={secret.knownByPlayer ? 'on' : ''} />
            ))}
          </div>
        </section>
      )}

      <Link to={`/npc/${npc.id}`} className="btn btn-secondary btn-sm btn-block state-dossier">
        Open dossier
      </Link>
    </div>
  );
}

function History({ conversations, activeId, onOpen, onNew }) {
  return (
    <div className="history">
      <button type="button" className="btn btn-secondary btn-block" onClick={onNew}>
        <Icon name="plus" />
        New conversation
      </button>
      {!conversations && (
        <div className="history-loading" aria-hidden="true">
          <Skeleton height={14} />
          <Skeleton width="60%" height={12} />
        </div>
      )}
      {conversations?.length === 0 && <p className="history-empty">No past conversations yet.</p>}
      {conversations?.length > 0 && (
        <ul className="history-list">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                className="history-item"
                aria-current={conversation.id === activeId ? 'true' : undefined}
                onClick={() => onOpen(conversation.id)}
              >
                <span className="history-title">{conversation.title}</span>
                <span className="history-meta">
                  {plural(conversation.messageCount, 'message')} · {relativeTime(conversation.updatedAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ThreadSkeleton() {
  return (
    <div className="thread" aria-busy="true" aria-label="Loading conversation">
      <div className="msg msg-user">
        <Skeleton width={220} height={40} radius={18} />
      </div>
      <div className="msg msg-npc">
        <Skeleton width={32} height={32} radius="50%" />
        <div style={{ display: 'grid', gap: 10 }}>
          <Skeleton width="90%" height={16} />
          <Skeleton width="75%" height={16} />
          <Skeleton width="40%" height={16} />
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { id } = useParams();
  const { upsert } = useLibrary();
  const wide = useMediaQuery('(min-width: 1200px)');
  const [npc, setNpc] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [conversations, setConversations] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [lastChanges, setLastChanges] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [panelShown, setPanelShown] = useState(true);
  const logRef = useRef(null);
  const inputRef = useRef(null);
  const jumpRef = useRef(true);
  useAutoGrow(inputRef, draft, 200);
  useDocumentTitle(npc ? `Talking with ${npc.name}` : 'Conversation');

  useEffect(() => {
    let live = true;
    api
      .getNpc(id)
      .then((data) => live && setNpc(data))
      .catch((err) => live && setLoadError(err.message));

    // Opens the most recent conversation, as before; a new one starts empty.
    (async () => {
      try {
        const list = await api.conversations(id);
        if (!live) return;
        setConversations(list);
        if (!list.length) return;
        const conversation = await api.conversation(id, list[0].id);
        if (!live) return;
        jumpRef.current = true;
        setConversationId(conversation.id);
        setMessages(conversation.messages);
        setStartedAt(conversation.createdAt);
      } catch (err) {
        if (!live) return;
        setConversations((current) => current ?? []);
        setError(err.message);
      } finally {
        if (live) setLoadingThread(false);
      }
    })();

    return () => {
      live = false;
    };
  }, [id]);

  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    log.scrollTo({ top: log.scrollHeight, behavior: jumpRef.current ? 'auto' : 'smooth' });
    jumpRef.current = false;
  }, [messages, sending, loadingThread]);

  async function openConversation(cid) {
    setHistoryOpen(false);
    setLoadingThread(true);
    setError('');
    try {
      const conversation = await api.conversation(id, cid);
      jumpRef.current = true;
      setConversationId(cid);
      setMessages(conversation.messages);
      setStartedAt(conversation.createdAt);
      setLastChanges(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingThread(false);
    }
  }

  function startNew() {
    setHistoryOpen(false);
    setConversationId(null);
    setStartedAt(null);
    setMessages([]);
    setLastChanges(null);
    setError('');
    inputRef.current?.focus();
  }

  async function send(event) {
    event?.preventDefault();
    const message = draft.trim();
    if (!message || sending) return;
    setDraft('');
    setError('');
    setSending(true);
    setMessages((prev) => [...prev, { role: 'user', content: message, id: `local-${Date.now()}` }]);

    try {
      const result = await api.chat(id, { conversationId, message });
      setConversationId(result.conversationId);
      setStartedAt((prev) => prev || new Date().toISOString());
      setMessages((prev) => [
        ...prev,
        {
          role: 'npc',
          content: result.reply,
          id: `npc-${Date.now()}`,
          changes: result.changes,
          newMemories: result.newMemories,
        },
      ]);
      setNpc((prev) => ({ ...prev, ...result.npc }));
      upsert({ id, ...result.npc, updatedAt: new Date().toISOString() });
      setLastChanges(result.changes);
      api.conversations(id).then(setConversations).catch(() => {});
    } catch (err) {
      setError(err.message);
      setMessages((prev) => prev.slice(0, -1));
      setDraft(message);
    } finally {
      setSending(false);
      if (wide) inputRef.current?.focus();
    }
  }

  if (loadError) {
    return (
      <div className="page content">
        <EmptyState
          icon="alert"
          title="This conversation couldn’t be opened"
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

  if (!npc) {
    return (
      <div className="chat" aria-busy="true">
        <header className="chat-head">
          <Skeleton width={36} height={36} radius="50%" />
          <Skeleton width={160} height={16} />
        </header>
        <div className="chat-scroll">
          <div className="chat-column">
            <ThreadSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const first = firstName(npc.name);
  const identity = identityLine(npc);
  const empty = !loadingThread && messages.length === 0 && !sending;

  return (
    <div className="page chat">
      <header className="chat-head">
        <Link to={`/npc/${id}`} className="icon-btn" aria-label={`Back to ${npc.name}’s dossier`} data-tip="Dossier">
          <Icon name="arrowLeft" />
        </Link>
        <div className="chat-id">
          <Avatar name={npc.name} src={npc.portraitUrl} size="sm" />
          <div className="chat-id-text">
            <h1>{npc.name}</h1>
            <p className="chat-status" aria-live="polite">
              {sending ? <span className="chat-typing">{first} is thinking…</span> : <Mood state={npc.emotionalState} />}
            </p>
          </div>
        </div>
        <div className="chat-tools">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHistoryOpen(true)}>
            <Icon name="clock" />
            <span className="hide-sm">History</span>
            {conversations?.length > 0 && <span className="history-count">{conversations.length}</span>}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={startNew}
            aria-label="New conversation"
            data-tip="New conversation"
          >
            <Icon name="plus" />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={`${first}’s mood and relationship`}
            data-tip={wide ? (panelShown ? 'Hide details' : 'Show details') : undefined}
            aria-pressed={wide ? panelShown : undefined}
            onClick={() => (wide ? setPanelShown(!panelShown) : setDetailsOpen(true))}
          >
            <Icon name="panel" />
          </button>
        </div>
      </header>

      <div className="chat-body">
        <div className="chat-thread">
          <div className="chat-scroll" ref={logRef}>
            <div className="chat-column">
              {loadingThread && <ThreadSkeleton />}

              {empty && (
                <div className="chat-intro">
                  <Avatar name={npc.name} src={npc.portraitUrl} size="xl" />
                  <h2 className="title-1">{npc.name}</h2>
                  {identity && <p className="muted">{identity}</p>}
                  {npc.setting && <p className="chat-intro-setting">{npc.setting}</p>}
                  <p className="chat-intro-cue">
                    <Mood state={npc.emotionalState} />
                    <span>{first} is waiting. Say something to begin.</span>
                  </p>
                </div>
              )}

              {!loadingThread && !empty && (
                <>
                  {startedAt && (
                    <p className="chat-date">
                      <span>{formatDate(startedAt, { dateStyle: 'long' })}</span>
                    </p>
                  )}
                  <ol className="thread" role="log" aria-label={`Conversation with ${npc.name}`}>
                    {messages.map((message) =>
                      message.role === 'user' ? (
                        <li className="msg msg-user" key={message.id || message.createdAt}>
                          <span className="sr-only">You: </span>
                          <div className="msg-bubble">
                            <Dialogue text={message.content} />
                          </div>
                        </li>
                      ) : (
                        <li className="msg msg-npc" key={message.id || message.createdAt}>
                          <Avatar name={npc.name} src={npc.portraitUrl} size="sm" />
                          <div className="msg-main">
                            <p className="msg-name">{first}</p>
                            <div className="msg-text">
                              <Dialogue text={message.content} />
                            </div>
                            <ShiftNote changes={message.changes} newMemories={message.newMemories} name={first} />
                          </div>
                        </li>
                      ),
                    )}
                    {sending && (
                      <li className="msg msg-npc is-thinking">
                        <Avatar name={npc.name} src={npc.portraitUrl} size="sm" />
                        <div className="msg-main">
                          <p className="msg-name">{first}</p>
                          <div className="msg-text">
                            <span className="dots" aria-hidden="true">
                              <i />
                              <i />
                              <i />
                            </span>
                            <span className="sr-only">{first} is thinking</span>
                          </div>
                        </div>
                      </li>
                    )}
                  </ol>
                </>
              )}
            </div>
          </div>

          <form className="composer" onSubmit={send}>
            <div className="chat-column">
              {error && (
                <div className="composer-error">
                  <Banner onDismiss={() => setError('')}>{error}</Banner>
                </div>
              )}
              <div className="composer-box">
                <label htmlFor="composer-input" className="sr-only">
                  Message {first}
                </label>
                <textarea
                  id="composer-input"
                  ref={inputRef}
                  rows={1}
                  value={draft}
                  placeholder={`Say something to ${first}…`}
                  autoFocus={wide}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      send();
                    }
                  }}
                />
                <button type="submit" className="send" aria-label="Send" disabled={sending || !draft.trim()}>
                  <Icon name="arrowUp" />
                </button>
              </div>
              <p className="composer-hint">
                Enter to send · Shift + Enter for a new line · Wrap actions in *asterisks*
              </p>
            </div>
          </form>
        </div>

        {wide && panelShown && (
          <aside className="chat-panel" aria-label={`${first}’s state`}>
            <CharacterState npc={npc} lastChanges={lastChanges} />
          </aside>
        )}
      </div>

      <Sheet open={historyOpen} onClose={() => setHistoryOpen(false)} title="Conversations">
        <History
          conversations={conversations}
          activeId={conversationId}
          onOpen={openConversation}
          onNew={startNew}
        />
      </Sheet>
      {!wide && (
        <Sheet open={detailsOpen} onClose={() => setDetailsOpen(false)} side="right" title={npc.name}>
          <CharacterState npc={npc} lastChanges={lastChanges} />
        </Sheet>
      )}
    </div>
  );
}
