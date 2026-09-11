import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Relationship from '../components/Relationship.jsx';

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

function DeltaLine({ changes }) {
  if (!changes) return null;
  const moved = Object.entries(changes.relationshipChange || {}).filter(([, value]) => value !== 0);
  if (!moved.length && !changes.emotionChanged) return null;
  return (
    <div className="delta">
      {moved.map(([key, value]) => (
        <span key={key}>
          {key} <b>{value > 0 ? `+${value}` : value}</b>{' '}
        </span>
      ))}
      {changes.emotionChanged && <span>· now {changes.emotionalState.label.toLowerCase()}</span>}
    </div>
  );
}

export default function Chat() {
  const { id } = useParams();
  const [npc, setNpc] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [lastChanges, setLastChanges] = useState(null);
  const logRef = useRef(null);

  useEffect(() => {
    api.getNpc(id).then(setNpc).catch((err) => setError(err.message));
    api.conversations(id).then(async (list) => {
      setConversations(list);
      if (list.length) await openConversation(list[0].id);
    });
  }, [id]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, sending]);

  async function openConversation(cid) {
    const conversation = await api.conversation(id, cid);
    setConversationId(cid);
    setMessages(conversation.messages);
    setLastChanges(null);
  }

  function startNew() {
    setConversationId(null);
    setMessages([]);
    setLastChanges(null);
    setError('');
  }

  async function send() {
    const message = draft.trim();
    if (!message || sending) return;
    setDraft('');
    setError('');
    setSending(true);
    setMessages((prev) => [...prev, { role: 'user', content: message, id: `local-${Date.now()}` }]);

    try {
      const result = await api.chat(id, { conversationId, message });
      setConversationId(result.conversationId);
      setMessages((prev) => [
        ...prev,
        { role: 'npc', content: result.reply, id: `npc-${Date.now()}` },
      ]);
      setNpc((prev) => ({ ...prev, ...result.npc }));
      setLastChanges(result.changes);
      api.conversations(id).then(setConversations);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => prev.slice(0, -1));
      setDraft(message);
    } finally {
      setSending(false);
    }
  }

  if (!npc) return <p className="thinking">{error || 'Loading…'}</p>;

  const firstName = npc.name.split(' ')[0];

  return (
    <>
      <div className="page-head">
        <div>
          <Link to={`/npc/${id}`} className="label">
            ← Dossier
          </Link>
          <h1>{npc.name}</h1>
        </div>
        <div className="spacer" />
        <button className="btn btn-sm" onClick={startNew}>
          + New conversation
        </button>
      </div>

      {error && <div className="banner">{error}</div>}

      <div className="chat">
        <section className="chat-main">
          <div className="chat-head">
            <div className="avatar" style={{ width: 34, height: 34, fontSize: 14 }}>
              {firstName[0]}
            </div>
            <h2>{npc.name}</h2>
            <span className="mood">
              {npc.emotionalState?.label} · {npc.emotionalState?.intensity}
            </span>
          </div>

          <div className="log" ref={logRef}>
            {messages.length === 0 && !sending && (
              <p className="thinking">
                {firstName} is waiting. Say something.
              </p>
            )}
            {messages.map((message) => (
              <div
                className={`msg ${message.role === 'user' ? 'player' : 'npc'}`}
                key={message.id || message.createdAt}
              >
                <div className="who">{message.role === 'user' ? 'You' : npc.name}</div>
                <div className="body">
                  {message.role === 'npc' ? <Dialogue text={message.content} /> : message.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="msg npc">
                <div className="who">{npc.name}</div>
                <div className="thinking">
                  <span className="dot">•</span>
                  <span className="dot">•</span>
                  <span className="dot">•</span>
                </div>
              </div>
            )}
          </div>

          <div className="composer">
            <textarea
              value={draft}
              placeholder={`Say something to ${firstName}…`}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
            />
            <button className="btn btn-primary" onClick={send} disabled={sending || !draft.trim()}>
              Send
            </button>
          </div>
        </section>

        <aside>
          <div className="panel">
            <span className="label">Relationship</span>
            <Relationship relationship={npc.relationship} />
            <DeltaLine changes={lastChanges} />
          </div>

          <div className="panel">
            <span className="label">Conversations</span>
            <button
              className={`convo-item ${conversationId === null ? 'on' : ''}`}
              onClick={startNew}
            >
              New conversation
            </button>
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                className={`convo-item ${conversation.id === conversationId ? 'on' : ''}`}
                onClick={() => openConversation(conversation.id)}
              >
                {conversation.title} · {conversation.messageCount}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
