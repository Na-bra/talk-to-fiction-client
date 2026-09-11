import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './auth.jsx';

const LibraryContext = createContext(null);

/**
 * The signed-in user's characters, shared by the gallery and the sidebar.
 * Pages that change a character report it here with `upsert` / `remove`, so
 * both stay current without refetching. Data is tagged with the account it
 * was loaded for, so a different sign-in never sees the previous list.
 */
export function LibraryProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState({ owner: null, npcs: null, error: '' });

  const refresh = useCallback(() => {
    const owner = userId;
    return api
      .listNpcs()
      .then((npcs) => setState({ owner, npcs, error: '' }))
      .catch((err) =>
        setState((current) => ({
          owner,
          npcs: current.owner === owner ? current.npcs : null,
          error: err.message,
        })),
      );
  }, [userId]);

  useEffect(() => {
    if (userId) refresh();
  }, [userId, refresh]);

  const upsert = useCallback((npc) => {
    setState((current) => {
      if (!current.npcs) return current;
      const npcs = current.npcs.some((item) => item.id === npc.id)
        ? current.npcs.map((item) => (item.id === npc.id ? { ...item, ...npc } : item))
        : [npc, ...current.npcs];
      return { ...current, npcs };
    });
  }, []);

  const remove = useCallback((id) => {
    setState((current) =>
      current.npcs ? { ...current, npcs: current.npcs.filter((item) => item.id !== id) } : current,
    );
  }, []);

  const mine = state.owner === userId;
  const value = {
    npcs: mine ? state.npcs : null,
    error: mine ? state.error : '',
    refresh,
    upsert,
    remove,
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export const useLibrary = () => useContext(LibraryContext);
