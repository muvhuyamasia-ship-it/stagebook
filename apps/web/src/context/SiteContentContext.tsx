import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_SITE_CONTENT } from "../data/defaultContent";
import { getJson, putJson } from "../lib/api";
import { mergeSiteContent, normalizeSiteContent } from "../lib/content";
import type { SiteContent, SiteContentPatch } from "../types";
import { useAuth } from "./AuthContext";

interface SiteContentContextValue {
  content: SiteContent;
  loading: boolean;
  saving: boolean;
  source: "api" | "fallback";
  error: string | null;
  refresh: () => Promise<void>;
  save: (patch: SiteContentPatch) => Promise<SiteContent>;
}

const SiteContentContext = createContext<SiteContentContextValue | undefined>(undefined);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState<"api" | "fallback">("fallback");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const response = await getJson<unknown>("/api/site/content", session);
      const next = normalizeSiteContent(response);
      setContent(next);
      setSource("api");
    } catch (cause) {
      setContent(DEFAULT_SITE_CONTENT);
      setSource("fallback");
      setError(cause instanceof Error ? cause.message : "Using local preview content.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [session?.token]);

  async function save(patch: SiteContentPatch) {
    setSaving(true);
    setError(null);
    const next = mergeSiteContent(content, patch);
    setContent(next);
    try {
      const response = await putJson<unknown>("/api/site/content", next, session);
      const normalized = normalizeSiteContent(response ?? next);
      setContent(normalized);
      setSource("api");
      return normalized;
    } catch (cause) {
      setSource("fallback");
      setError(cause instanceof Error ? cause.message : "Could not save site content.");
      throw cause;
    } finally {
      setSaving(false);
    }
  }

  const value = useMemo<SiteContentContextValue>(
    () => ({
      content,
      loading,
      saving,
      source,
      error,
      refresh,
      save
    }),
    [content, loading, saving, source, error]
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error("useSiteContent must be used inside SiteContentProvider");
  }
  return context;
}
