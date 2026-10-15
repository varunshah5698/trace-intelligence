import { Card, Empty, Kpi, PanelTitle, RiskCharacter, ScoreBar, btnGhost, fmtAxis, shortId } from "@/components/app/Shell";
import { FindingCard } from "@/components/app/FindingCard";
import { download, getSelected, loadAll } from "@/lib/trace/store";
import type { Alert } from "@/lib/trace/detect";
import { useReviewStore } from "@/lib/trace/reviews";
import { useAuth } from "@/hooks/use-auth";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function International() {
  const [country, setCountry] = useState("");
  const [cur, setCur] = useState("");
  const ds = useMemo(() => { const a = loadAll(); return a.find((d) => d.id === getSelected()) ?? a[0]; }, []);
  const txns = useMemo(() => {
    if (!ds) return [];
    return ds.txns.filter((t) => !(t.origin_country === "IN" && t.dest_country === "IN"))
      .filter((t) => !country || t.origin_country === country || t.dest_country === country)
      .filter((t) => !cur || t.currency === cur);
  }, [ds, country, cur]);

  const corridors = useMemo(() => {
    const m = new Map<string, { r: string; n: number; v: number }>();
    txns.forEach((t) => {
      const k = `${t.origin_country}→${t.dest_country}`;
      const e = m.get(k) ?? { r: k, n: 0, v: 0 };
      e.n++; e.v += t.amount; m.set(k, e);
    });
    return [...m.values()].sort((a, b) => b.n - a.n).slice(0, 14);
  }, [txns]);

  const byCur = useMemo(() => {
    const m = new Map<string, number>();
    txns.forEach((t) => m.set(t.currency, (m.get(t.currency) ?? 0) + t.amount));
    return [...m.entries()].map(([c, v]) => ({ c, v: Math.round(v) }));
  }, [txns]);

  // Aggregate repetitive alerts (e.g. ten identical pass-through hits for one
  // account) into one expandable row per entity + pattern.
  const SEVRANK: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
  interface IntlGroup { key: string; entity: string; title: string; severity: string; category: string; items: Alert[] }
  const groups = useMemo(() => {
    if (!ds) return [] as IntlGroup[];
    const list = ds.alerts.filter((a) => a.category === "cross-border" || a.category === "pass-through" || a.category === "network");
    const m = new Map<string, IntlGroup>();
    list.forEach((a) => {
      const entity = a.entities[0] ?? "unlinked";
      const key = `${entity}::${a.title}`;
      const g = m.get(key) ?? { key, entity, title: a.title, severity: a.severity, category: a.category, items: [] as Alert[] };
      g.items.push(a);
      if ((SEVRANK[a.severity] ?? 0) > (SEVRANK[g.severity] ?? 0)) { g.severity = a.severity; g.category = a.category; }
      m.set(key, g);
    });
    return [...m.values()].sort((x, y) => y.items.length - x.items.length || (SEVRANK[y.severity] ?? 0) - (SEVRANK[x.severity] ?? 0));
  }, [ds]);
  const [detail, setDetail] = useState<IntlGroup | null>(null);
  const [hideDis, setHideDis] = useState(false);
  const [v, setV] = useState(0);
  void v;
  const store = useReviewStore();
  const { user } = useAuth();
  const alertCount = groups.reduce((s, g) => s + g.items.length, 0);

  if (!ds) return <Card><Empty title="No dataset available" body="Upload a transaction CSV or generate a synthetic dataset to begin analysis." /></Card>;

  const maxN = Math.max(1, ...corridors.map((c) => c.n));

  const dismissed = (g: IntlGroup) => g.items.every((a) => store.statusOf(a.id) === "false-positive");
  async function dismissGroup(g: IntlGroup) {
    const actor = String(user?.email ?? "analyst");
    for (const a of g.items) { await store.setStatus(a.id, "false-positive", actor); }
    setV((x) => x + 1);
    toast.success(`Dismissed ${g.items.length} signal${g.items.length === 1 ? "" : "s"} · ${shortId(g.entity)}`, { description: "Recorded as false positive — synced across reviewers." });
  }
  function exportGroup(g: IntlGroup) {
    download(`${ds.name}-${g.entity}-alerts.json`, JSON.stringify(g.items, null, 2), "application/json");
    toast.success("Group exported", { description: `${g.items.length} alert${g.items.length === 1 ? "" : "s"} saved as JSON.` });
  }
  function exportAll() {
    download(`${ds.name}-intl-alerts.json`, JSON.stringify(groups.flatMap((g) => g.items), null, 2), "application/json");
    toast.success("Alert list exported", { description: `${alertCount} signals saved as JSON.` });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select value={country} onChange={(e) => setCountry(e.target.value)} className="rounded-md border border-input bg-card px-2 py-1.5 text-xs" aria-label="Country filter">
          <option value="">All countries</option>{[...new Set([...ds.txns.map((t) => t.origin_country), ...ds.txns.map((t) => t.dest_country)])].map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={cur} onChange={(e) => setCur(e.target.value)} className="rounded-md border border-input bg-card px-2 py-1.5 text-xs" aria-label="Currency filter">
          <option value="">All currencies</option>{[...new Set(ds.txns.map((t) => t.currency))].map((c) => <option key={c}>{c}</option>)}
        </select>
        <span className="tnum ml-auto self-center text-xs text-muted-foreground">{txns.length.toLocaleString("en-IN")} cross-border transfers</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Cross-border Txns" value={txns.length.toLocaleString("en-IN")} />
        <Kpi label="Active Corridors" value={String(corridors.length)} />
        <Kpi label="Currencies" value={String(byCur.length)} />
        <Kpi label="Intl Alerts" value={String(alertCount)} sub={`${groups.length} entit${groups.length === 1 ? "y" : "ies"} grouped`} />
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        <Card>
          <PanelTitle title="Corridor flows" sub="Bar thickness = transfer count · values in compact international notation (k/M)" />
          <div className="space-y-2 px-4 py-3">
            {corridors.map((c) => (
              <button key={c.r} onClick={() => setCountry(c.r.split("→")[0])} className="block w-full text-left" title="Filter by origin">
                <div className="flex justify-between text-xs"><span className="mono font-semibold">{c.r}</span><span className="tnum text-muted-foreground">{c.n} txns · {fmtAxis(Math.round(c.v))}</span></div>
                <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#C084FC] transition-all duration-700" style={{ width: `${(c.n / maxN) * 100}%` }} /></div>
              </button>
            ))}
            {corridors.length === 0 && <p className="text-[13px] text-muted-foreground">No cross-border transfers in scope — showing a network graph instead of a map avoids fabricating geography.</p>}
          </div>
        </Card>
        <Card>
          <PanelTitle title="Value by currency" sub="Original-currency aggregates · compact axis (k/M)" />
          <div className="h-64 px-2 pb-2">
            <ResponsiveContainer>
              <BarChart data={byCur} layout="vertical">
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={(v: number) => fmtAxis(v)} />
                <YAxis type="category" dataKey="c" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={48} />
                <Tooltip contentStyle={{ background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="v" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card>
        <PanelTitle
          title="International findings"
          sub="One row per account — click for the full picture"
          right={
            <div className="flex shrink-0 items-center gap-2">
              <span className="tnum hidden text-xs text-muted-foreground sm:block">{alertCount} signals · {groups.length} accounts</span>
              <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-muted-foreground" title="Hide accounts fully recorded as false positive">
                <input type="checkbox" checked={hideDis} onChange={(e) => setHideDis(e.target.checked)} className="h-3.5 w-3.5 accent-[color:var(--primary)]" />
                Hide dismissed
              </label>
              {groups.length > 0 && (
                <button onClick={exportAll} className="rounded-full border border-border bg-[color:var(--glass)] px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-colors hover:bg-[color:var(--glass-hi)]" title="Download the whole list as JSON">Export all</button>
              )}
            </div>
          }
        />
        {/* clean rows: account · condition · score. Click for the full card. */}
        <div className="space-y-1.5 px-3 pb-3 pt-2.5">
          {groups.filter((g) => !hideDis || !dismissed(g)).slice(0, 20).map((g) => {
            const dis = dismissed(g);
            const top = g.items.reduce((b, x) => (x.score > b.score ? x : b), g.items[0]);
            return (
              <button key={g.key} onClick={() => setDetail(g)} disabled={dis}
                className={`group flex w-full items-center gap-3 rounded-xl border border-border/60 bg-[color:var(--glass)] px-3 py-2.5 text-left backdrop-blur-md transition-all hover:translate-x-0.5 hover:border-[color:var(--glass-border-hi)] ${dis ? "opacity-45 hover:translate-x-0" : ""}`}>
                <RiskCharacter severity={g.severity} size={28} />
                <span className="mono min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground group-hover:text-[#c4b5fd]" title={g.entity}>{shortId(g.entity)}</span>
                <span className="hidden min-w-0 flex-1 truncate text-[12px] text-muted-foreground sm:block">{g.title.split("—")[0].trim()}</span>
                {g.items.length > 1 && (
                  <span className="tnum shrink-0 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground" title={`${g.items.length} triggers grouped`}>×{g.items.length}</span>
                )}
                {dis && <span className="shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">dismissed</span>}
                <ScoreBar score={top.score} w={56} />
              </button>
            );
          })}
          {groups.length === 0 && <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">No international findings. Upload cross-border data or widen the filters.</p>}
        </div>
      </Card>
      {/* full detail card — everything about one finding, on demand */}
      {detail && (
        <FindingCard
          a={detail.items.reduce((b, x) => (x.score > b.score ? x : b), detail.items[0])}
          onClose={() => setDetail(null)}
          note={detail.items.length > 1 ? `${detail.items.length} triggers grouped for this account · showing the highest-priority one` : undefined}
          extra={
            <>
              {!dismissed(detail) && (
                <button onClick={() => { dismissGroup(detail); setDetail(null); }} className={btnGhost} title="Record every trigger in this group as false positive">Dismiss group</button>
              )}
              <button onClick={() => exportGroup(detail)} className={btnGhost} title="Download this group as JSON">Export</button>
            </>
          }
        />
      )}
    </div>
  );
}
