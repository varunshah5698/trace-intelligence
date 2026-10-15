// Shared review state: Convex backend is the source of truth so reviewers on
// different computers see each other's statuses and notes. localStorage mirrors
// every write for instant UI and offline visibility, and is merged underneath
// backend rows on read. Every backend write also lands in the audit trail.
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useMemo } from "react";

export type Review = "new" | "reviewing" | "reviewed" | "false-positive" | "escalated";
export interface ReviewNote { at: string; text: string; actor?: string; }

const RKEY = "trace.v1.reviews";
const NKEY = "trace.v1.alertnotes";

function localReviews(): Record<string, Review> {
  try { return JSON.parse(localStorage.getItem(RKEY) ?? "{}"); } catch { return {}; }
}
function localNotes(): Record<string, ReviewNote[]> {
  try { return JSON.parse(localStorage.getItem(NKEY) ?? "{}"); } catch { return {}; }
}
function writeLocalReviews(r: Record<string, Review>) {
  try { localStorage.setItem(RKEY, JSON.stringify(r)); } catch { /* quota — backend still persists */ }
}
function writeLocalNotes(n: Record<string, ReviewNote[]>) {
  try { localStorage.setItem(NKEY, JSON.stringify(n)); } catch { /* quota — backend still persists */ }
}

export function useReviewStore() {
  const remote = useQuery(api.trace.listAlertReviews);
  const save = useMutation(api.trace.saveAlertReview);
  return useMemo(() => {
    const map = new Map(
      ((remote ?? []) as { key: string; status: string; notes: ReviewNote[] }[]).map((r) => [r.key, r]),
    );
    const statusOf = (key: string): Review =>
      (map.get(key)?.status as Review) ?? localReviews()[key] ?? "new";
    const statusMap = (): Record<string, Review> => {
      const o: Record<string, Review> = { ...localReviews() };
      map.forEach((r, k) => { o[k] = r.status as Review; });
      return o;
    };
    const notesOf = (key: string): ReviewNote[] => {
      const rn = (map.get(key)?.notes ?? []) as ReviewNote[];
      const ln = localNotes()[key] ?? [];
      const seen = new Set(rn.map((n) => n.at + "|" + n.text));
      return [...rn, ...ln.filter((n) => !seen.has(n.at + "|" + n.text))]
        .sort((a, b) => a.at.localeCompare(b.at));
    };
    const setStatus = async (key: string, status: Review, actor: string) => {
      const r = localReviews();
      r[key] = status;
      writeLocalReviews(r);
      try { await save({ key, status, actor }); } catch { /* offline — local copy keeps it visible */ }
    };
    const addNote = async (key: string, text: string, actor: string) => {
      const note = { at: new Date().toISOString(), text, actor };
      const n = localNotes();
      n[key] = [...(n[key] ?? []), note];
      writeLocalNotes(n);
      try { await save({ key, note, actor }); } catch { /* offline — local copy keeps it visible */ }
    };
    return { statusOf, statusMap, notesOf, setStatus, addNote, shared: remote !== undefined };
  }, [remote, save]);
}
