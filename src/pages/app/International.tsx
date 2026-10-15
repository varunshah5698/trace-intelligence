import { Card, Empty, Kpi, PanelTitle, SevBadge, WarnStrip } from "@/components/app/Shell";
import { getSelected, loadAll } from "@/lib/trace/store";
import { useMemo, useState } from "react";
import { Link } from "react-router";
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

  if (!ds) return <Card><Empty title="No dataset available" body="Upload a transaction CSV or generate a synthetic dataset to begin analysis." /></Card>;

  const alerts = ds.alerts.filter((a) => a.category === "cross-border" || a.category === "pass-through" || a.category === "network");
  const maxN = Math.max(1, ...corridors.map((c) => c.n));

  return (
    <div className="space-y-3">
      <WarnStrip>Each item below is a review signal, not a confirmed crime. Country, amount, and corridor alone never decide an alert.</WarnStrip>
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
        <Kpi label="Intl Alerts" value={String(alerts.length)} />
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        <Card>
          <PanelTitle title="Corridor flows" sub="Bar thickness = transfer count · legend: count (bar), value below" />
          <div className="space-y-2 px-4 py-3">
            {corridors.map((c) => (
              <button key={c.r} onClick={() => setCountry(c.r.split("→")[0])} className="block w-full text-left" title="Filter by origin">
                <div className="flex justify-between text-xs"><span className="mono font-semibold">{c.r}</span><span className="tnum text-muted-foreground">{c.n} txns · {Math.round(c.v).toLocaleString("en-IN")}</span></div>
                <div className="mt-1 h-2 rounded bg-muted"><div className="h-2 rounded bg-[color:var(--teal)]" style={{ width: `${(c.n / maxN) * 100}%` }} /></div>
              </button>
            ))}
            {corridors.length === 0 && <p className="text-[13px] text-muted-foreground">No cross-border transfers in scope — showing a network graph instead of a map avoids fabricating geography.</p>}
          </div>
        </Card>
        <Card>
          <PanelTitle title="Value by currency" sub="Original-currency aggregates" />
          <div className="h-64 px-2 pb-2">
            <ResponsiveContainer>
              <BarChart data={byCur} layout="vertical">
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
                <YAxis type="category" dataKey="c" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={48} />
                <Tooltip contentStyle={{ background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="v" fill="#26C6B8" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card>
        <PanelTitle title="International alert list" sub="Unusual flows · intermediary chains · splitting · circular routes · unfamiliar counterparties" />
        <div className="divide-y divide-border/50">
          {alerts.slice(0, 15).map((a) => (
            <Link key={a.id} to={`/detections/${a.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40">
              <SevBadge sev={a.severity} />
              <span className="flex-1 truncate text-[13px]">{a.title}</span>
              <span className="hidden text-xs text-muted-foreground md:block">{a.category}</span>
            </Link>
          ))}
          {alerts.length === 0 && <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">No international findings. Upload cross-border data or widen the filters.</p>}
        </div>
      </Card>
    </div>
  );
}
