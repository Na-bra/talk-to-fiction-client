import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useLibrary } from '../library.jsx';
import { useToast } from '../toast.jsx';
import Icon from '../components/Icon.jsx';
import { Avatar, Banner, EmptyState, Mood, Skeleton, Spinner } from '../components/ui.jsx';
import { identityLine, plural } from '../lib/format.js';
import { useDocumentTitle } from '../lib/hooks.js';

const SORTS = {
  recent: { label: 'Recently added', compare: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
  active: { label: 'Recently active', compare: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt) },
  name: { label: 'Name', compare: (a, b) => a.name.localeCompare(b.name) },
};

const searchable = (npc) =>
  [npc.name, npc.occupation, npc.setting, npc.background, ...(npc.personality || [])]
    .join(' ')
    .toLowerCase();

function CharacterCard({ npc }) {
  const identity = identityLine(npc);
  const excerpt = npc.background || npc.motivations;
  const traits = npc.personality || [];

  return (
    <article className="char-card">
      <div className="char-card-top">
        <Avatar name={npc.name} size="lg" />
        <Mood state={npc.emotionalState} />
      </div>

      <div className="char-card-heading">
        <h2 className="char-card-name">
          <Link to={`/npc/${npc.id}`} className="stretched-link">
            {npc.name}
          </Link>
        </h2>
        {identity && <p className="char-card-identity">{identity}</p>}
      </div>

      {npc.setting && <p className="char-card-setting">{npc.setting}</p>}

      <p className={`char-card-excerpt ${excerpt ? '' : 'is-empty'}`}>
        {excerpt || 'No background written yet.'}
      </p>

      <div className="char-card-foot">
        <div className="chips">
          {traits.slice(0, 3).map((trait) => (
            <span className="chip" key={trait}>
              {trait}
            </span>
          ))}
          {traits.length > 3 && <span className="chip">+{traits.length - 3}</span>}
        </div>
        <Link
          to={`/npc/${npc.id}/chat`}
          className="btn btn-sm btn-secondary char-card-talk"
          aria-label={`Talk to ${npc.name}`}
        >
          <Icon name="chat" />
          Talk
        </Link>
      </div>
    </article>
  );
}

function CardSkeleton() {
  return (
    <div className="char-card is-skeleton" aria-hidden="true">
      <Skeleton width={56} height={56} radius="30%" />
      <div style={{ display: 'grid', gap: 8 }}>
        <Skeleton width="60%" height={20} />
        <Skeleton width="38%" height={12} />
      </div>
      <div style={{ display: 'grid', gap: 7 }}>
        <Skeleton height={12} />
        <Skeleton height={12} />
        <Skeleton width="70%" height={12} />
      </div>
    </div>
  );
}

function EmptyArt() {
  return (
    <div className="empty-art" aria-hidden="true">
      <Avatar name="Mara Vell" size="lg" />
      <Avatar name="Kevin Cross" size="lg" />
      <Avatar name="Ione" size="lg" />
    </div>
  );
}

export default function Gallery() {
  useDocumentTitle('Library');
  const { npcs, error, refresh, upsert } = useLibrary();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [trait, setTrait] = useState(null);
  const [sort, setSort] = useState('recent');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // The traits that actually occur in this library, most common first.
  const commonTraits = useMemo(() => {
    const counts = new Map();
    for (const npc of npcs || []) {
      for (const item of npc.personality || []) counts.set(item, (counts.get(item) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([name]) => name);
  }, [npcs]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (npcs || [])
      .filter((npc) => !needle || searchable(npc).includes(needle))
      .filter((npc) => !trait || npc.personality?.includes(trait))
      .sort(SORTS[sort].compare);
  }, [npcs, query, trait, sort]);

  const addSample = async () => {
    setAdding(true);
    setAddError('');
    try {
      const npc = await api.createSample();
      upsert(npc);
      toast(`${npc.name} added to your library`);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const filtering = query.trim() || trait;
  const clearFilters = () => {
    setQuery('');
    setTrait(null);
  };

  return (
    <div className="page content">
      <header className="lib-head">
        <div>
          <h1 className="title-1">Library</h1>
          <p className="muted">
            {npcs?.length
              ? `${plural(npcs.length, 'character')}, private to your account.`
              : 'Characters you create live here, private to your account.'}
          </p>
        </div>
        <Link to="/create" className="btn btn-primary">
          <Icon name="plus" />
          New character
        </Link>
      </header>

      {error && (
        <Banner
          action={
            <button type="button" className="btn btn-sm btn-ghost" onClick={refresh}>
              Try again
            </button>
          }
        >
          Couldn’t load your characters. {error}
        </Banner>
      )}

      {!npcs && !error && (
        <div className="char-grid" aria-busy="true" aria-label="Loading characters">
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <CardSkeleton key={key} />
          ))}
        </div>
      )}

      {npcs?.length === 0 && (
        <div className="lib-empty">
          <EmptyState
            art={<EmptyArt />}
            title="Begin your archive"
            actions={
              <>
                <Link to="/create" className="btn btn-primary btn-lg">
                  <Icon name="plus" />
                  Create a character
                </Link>
                <button type="button" className="btn btn-secondary btn-lg" onClick={addSample} disabled={adding}>
                  {adding && <Spinner />}
                  {adding ? 'Adding…' : 'Add a sample: Kevin Cross'}
                </button>
              </>
            }
          >
            Write a character from scratch, or give the generator a few details and let it draft
            the rest. Everyone you add can be talked to, and remembers you.
          </EmptyState>
          {addError && <Banner onDismiss={() => setAddError('')}>{addError}</Banner>}
        </div>
      )}

      {npcs?.length > 0 && (
        <>
          <div className="lib-toolbar" role="search">
            <label className="input-affix lib-search">
              <span className="sr-only">Search characters</span>
              <Icon name="search" />
              <input
                type="search"
                className="input"
                placeholder="Search by name, role, setting or trait"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className="lib-sort">
              <span className="sr-only">Sort by</span>
              <select className="select" value={sort} onChange={(event) => setSort(event.target.value)}>
                {Object.entries(SORTS).map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {commonTraits.length > 1 && (
            <div className="chips lib-filters" role="group" aria-label="Filter by trait">
              <button type="button" className="chip chip-lg" aria-pressed={!trait} onClick={() => setTrait(null)}>
                All
              </button>
              {commonTraits.map((item) => (
                <button
                  type="button"
                  key={item}
                  className="chip chip-lg"
                  aria-pressed={trait === item}
                  onClick={() => setTrait(trait === item ? null : item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          {filtering && (
            <p className="lib-count faint" aria-live="polite">
              {plural(visible.length, 'result')}
            </p>
          )}

          {visible.length > 0 ? (
            <div className="char-grid">
              {visible.map((npc) => (
                <CharacterCard npc={npc} key={npc.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="search"
              title="No one matches"
              actions={
                <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                  Clear search
                </button>
              }
            >
              Try a different name, or clear the filters to see the whole library.
            </EmptyState>
          )}
        </>
      )}
    </div>
  );
}
