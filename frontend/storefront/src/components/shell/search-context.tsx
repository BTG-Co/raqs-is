"use client";

import { createContext, useContext, useMemo, useState } from "react";

type SearchState = {
  query: string;
  setQuery: (query: string) => void;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
};

const SearchContext = createContext<SearchState | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const [enabled, setEnabled] = useState(false);
  const value = useMemo(() => ({ query, setQuery, enabled, setEnabled }), [query, enabled]);
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function usePageSearch(): SearchState {
  const value = useContext(SearchContext);
  if (!value) throw new Error("usePageSearch must be used inside SearchProvider.");
  return value;
}
