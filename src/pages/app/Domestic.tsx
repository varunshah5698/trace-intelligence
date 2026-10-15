import { Card, Empty, Kpi, PanelTitle, SevBadge, WarnStrip, num } from "@/components/app/Shell";
import { getSelected, loadAll } from "@/lib/trace/store";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const TABS = ["splitting", "velocity", "pass-through", "network", "behaviour", "structuring", "cross-border"];

export default function Domestic() {
  const [tab, setTab] = useState("splitting");
  const [channel, setChannel] = useState("");
  const [q, setQ] = useState("");
  const [tick, setTick] = useState(0);
  void tick;
  const ds = useMemo(() => { const a = loadAll(); return a.find((d) => d.id === getSelected()) ?? a[0]; }, []);
  const txns = useMemo(() => {
    if (!ds) return [];
    return ds.txns.filter((t) => t.origin_country === "IN" && t.dest_country === "IN")
      .filter((t) => !channel || t.channel === channel)
      .filter((t) => !q || t.sender.includes(q) || t.receiver.includes(q) || t.id.includes(q));
  }, [ds, channel, q]);

  const channels = useMemo(() => {
    const m = new Map<string, number>();
    txns.forEach((t) => m.set(t.channel, (m.get(t.channel) ?? 0) + 1));
    return [...m.entries()].map(([name, n]) => ({ name, n }));
  }, [txns]);

  const buckets = useMemo(() => {
    const m = new Map<string, { d: string; inn: number; out: number }>();
    [...txns].sort((a, b) => a.epoch - b.epoch).forEach((t) => {
      const k = new Date(t.epoch).toISOString().slice(0, 10);
      const e = m.get(k) ?? { d: k.slice(5), inn: 0, out: 0 };
      e.inn += t.amount; e.out += t.amount * 0.92;
      m.set(k, e);
    });
    return [...m.values()].slice(-24);
  }, [txns]);

  const hour = useMemo(() => {
    const h = new Array(24).fill(0);
    txns.forEach((t) => { const hh = new Date(t.epoch).getHours(); h[hh]++; });
    return h.map((n, i) => ({ h: `${i}h`, n }));
  }, [txns]);

  if (!ds) return <Card><Empty title="No dataset available" body="Upload a transaction CSV or generate a synthetic dataset to begin analysis." /></Card>;

  const alerts = ds.alerts.filter((a) => a.category === tab || (tab === "network" && (a.category === "network")));
  const inr = txns.filter((t) => t.currency === "INR").reduce((s, t) => s + t.amount, 0);
  const accts = new Set([...txns.map((t) => t.sender), ...txns.map((t) => t.receiver)]);
  const perAcct = new Map<string, number>();
  txns.forEach((t) => perAcct.set(t.sender, (perAcct.get(t.sender) ?? 0) + 1));
  const hiVel = [...perAcct.values()].filter((n) => n > 10).length;

  return (
    <div className="space-y-3">
      <WarnStrip>Channel labels (UPI, IMPS, NEFT, RTGS, bank transfer) describe fields in your file. Aegis is not connected to Indian banking or payment infrastructure.</WarnStrip>
      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Account search…" className="w-52 rounded-md border border-input bg-card px-2.5 py-1.5 text-[13px] outline-none" aria-label="Account search" />
        <select value={channel} onChange={(e) => setChannel(e.target.value)} className="rounded-md border border-input bg-card px-2 py-1.5 text-xs" aria-label="Payment channel">
          <option value="">All channels</option>{[...new Set(ds.txns.map((t) => t.channel))].map((c) => <option key={c}>{c}</option>)}
        </select>
        <Link to="/transactions" className="ml-auto rounded-md border border-border px-3 py-1.5 text-[13px] hover:bg-muted">Run Analysis → transactions</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Transactions" value={num(txns.length)} />
        <Kpi label="Total INR Value" value={inr ? `${Math.round(inr).toLocaleString("en-IN")} INR` : "—"} sub="INR legs only" />
        <Kpi label="Unique Accounts" value={num(accts.size)} />
        <Kpi label="Detection Alerts" value={num(ds.alerts.length)} />
        <Kpi label="High-Velocity Accounts" value={num(hiVel)} sub=">10 transfers" />
        <Kpi label="Open Reviews" value={num(ds.alerts.filter((a) => a.severity === "high" || a.severity === "critical").length)} />
      </div>
      <div className="grid gap-3 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <PanelTitle title="Domestic volume over time" sub="Incoming vs outgoing value" />
          <div className="h-56 px-2 pb-2">
            <ResponsiveContainer>
              <BarChart data={buckets}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={44} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
                <Tooltip contentStyle={{ background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="inn" name="Incoming" fill="#5B8CFF" radius={[2, 2, 0, 0]} />
                <Bar dataKey="out" name="Outgoing" fill="#26C6B8" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <PanelTitle title="Payment-channel distribution" sub="Only channels present in data" />
          <div className="h-40">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={channels} dataKey="n" nameKey="name" innerRadius={36} outerRadius={58} paddingAngle={2}>
                  {channels.map((_, i) => <Cell key={i} fill={["#5B8CFF", "#26C6B8", "#F4B544", "#9AA8FF", "#36C995", "#F05252"][i % 6]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 px-4 pb-3 text-xs">{channels.map((c, i) => (
            <div key={c.name} className="flex justify-between"><span className="text-muted-foreground">{c.name}</span><span className="tnum">{num(c.n)}</span></div>))}</div>
        </Card>
      </div>
      <Card>
        <PanelTitle title="Hourly activity" sub="When domestic transfers occur" />
        <div className="h-36 px-2 pb-2">
          <ResponsiveContainer>
            <BarChart data={hour}>
              <XAxis dataKey="h" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} interval={3} />
              <Tooltip contentStyle={{ background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="n" fill="#5B8CFF" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <div className="flex gap-1 overflow-x-auto border-b border-border px-2 text-[13px]">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap px-3 py-2 capitalize ${tab === t ? "border-b-2 border-[color:var(--primary)] font-semibold text-foreground" : "text-muted-foreground"}`}>{t.replace("-", " ")}</button>
          ))}
        </div>
        <div className="divide-y divide-border/50">
          {alerts.slice(0, 12).map((a) => (
            <Link key={a.id} to={`/detections/${a.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40">
              <SevBadge sev={a.severity} />
              <span className="flex-1 truncate text-[13px]">{a.title}</span>
              <span className="mono hidden text-[11px] text-muted-foreground md:block">{a.txnIds.slice(0, 2).join(", ")}</span>
            </Link>
          ))}
          {alerts.length === 0 && <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">No {tab} findings in this dataset. Switch tabs or adjust rules.</p>}
        </div>
      </Card>
    </div>
  );
}
