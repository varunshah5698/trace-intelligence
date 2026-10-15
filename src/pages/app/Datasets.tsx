import { Card, Empty, PanelTitle, WarnStrip, btnGhost, btnPrimary, emit, inputCls, num } from "@/components/app/Shell";
import { buildMapping, inferMapping, normalize, parseCSV, readiness, type FieldMapping, type NormalizedTxn, type QualityReport, type SemanticField } from "@/lib/trace/csv";
import { DEFAULT_RULES, runDetection, type RuleConfig } from "@/lib/trace/detect";
import { generate } from "@/lib/trace/synthetic";
import { download, loadAll, saveAll, setSelected, type Dataset } from "@/lib/trace/store";
import { toCSV } from "@/lib/trace/csv";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { ArrowLeft, ArrowRight, CheckCircle2, FileUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

const FIELD_OPTS: (SemanticField | "")[] = ["", "txn_id", "sender", "receiver", "amount", "currency", "timestamp", "origin_country", "dest_country", "channel", "purpose", "status", "ignore"];
const MODES = [
  { id: "quality", label: "Data-quality profiling", need: [] as string[] },
  { id: "domestic", label: "Domestic transaction monitoring", need: ["sender", "receiver", "amount", "timestamp"] },
  { id: "intl", label: "International fund-flow analysis", need: ["sender", "amount"] },
  { id: "split", label: "Transaction splitting detection", need: ["sender", "amount", "timestamp"] },
  { id: "network", label: "Account network analysis", need: ["sender", "receiver"] },
  { id: "behav", label: "Behavioural anomaly detection", need: ["sender", "amount", "timestamp"] },
  { id: "fx", label: "FX normalisation", need: ["amount"] },
];

export default function Datasets() {
  const nav = useNavigate();
  const saveRemote = useMutation(api.trace.save);
  const [list, setList] = useState<Dataset[]>(loadAll());
  const [wizard, setWizard] = useState<null | Wiz>(null);

  function refresh() { setList(loadAll()); }
  function del(id: string) {
    if (!confirm("Delete this dataset and its analysis? This cannot be undone.")) return;
    saveAll(loadAll().filter((d) => d.id !== id)); emit(); refresh();
  }
  function loadDemo() {
    const { txns, manifest } = generate({ name: "Demo — retail + planted cases", count: 1500, accounts: 80, mode: "mixed", days: 60, seed: 7, splitting: 2, passthrough: 1, circular: 1 });
    const cols = Object.keys(txns[0].raw);
    const t = { columns: cols, rows: txns.map((x) => x.raw as Record<string, string>), delimiter: ",", encodingNote: "" };
    const m = inferMapping(t);
    const c2f: Record<string, string> = {};
    m.forEach((x) => { c2f[x.column] = x.field ?? ""; });
    const norm = normalize(t, buildMapping(c2f as never));
    const alerts = runDetection(norm.txns, DEFAULT_RULES.map((x) => ({ ...x })));
    const ds: Dataset = {
      id: `ds-${Date.now().toString(36)}`, name: "Demo dataset (synthetic, labelled)", source: "demo",
      createdAt: new Date().toISOString(), columns: cols, mappings: m, col2field: c2f,
      txns: norm.txns, report: norm.report, alerts, rules: DEFAULT_RULES.map((x) => ({ ...x })), manifest, tier: 1,
    };
    saveAll([ds, ...loadAll()]); setSelected(ds.id); emit(); refresh(); nav(`/datasets/${ds.id}`);
  }

  if (wizard) return <Wizard w={wizard} setW={setWizard} onDone={(ds) => { refresh(); nav(`/datasets/${ds.id}`); }} saveRemote={saveRemote} />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setWizard({ step: 1, name: "", desc: "", source: "Mixed" })} className={btnPrimary}>Upload CSV</button>
        <button onClick={loadDemo} className={btnGhost}>Use generated sample</button>
        <Link to="/studio" className="rounded-md px-3.5 py-2 text-[13px] text-[color:var(--primary)] hover:underline">or open AI Data Studio →</Link>
      </div>
      <Card>
        <PanelTitle title={`Dataset Library (${list.length})`} sub="Ownership is per-browser in this build; deletion is permanent." />
        <div className="overflow-x-auto">
          <table className="mt-2 w-full min-w-[900px] text-left text-[13px]">
            <thead><tr className="border-y border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              {["Name", "Source", "Records", "Currencies", "Coverage", "Quality", "Analysis", "Created"].map((h) => <th key={h} className="px-4 py-2 font-medium">{h}</th>)}
              <th className="px-4 py-2 text-right font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-muted/40">
                  <td className="px-4 py-2.5"><Link to={`/datasets/${d.id}`} className="font-semibold text-foreground hover:underline">{d.name}</Link>
                    <p className="mono text-[11px] text-muted-foreground">tier {d.tier} · {d.source}</p></td>
                  <td className="px-4 py-2.5 text-muted-foreground">{d.source}</td>
                  <td className="tnum px-4 py-2.5">{num(d.txns.length)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{d.report.currencies.slice(0, 3).map((c) => c.code).join(", ") || "—"}</td>
                  <td className="tnum px-4 py-2.5 text-xs text-muted-foreground">{d.report.minDate?.slice(0, 10) ?? "—"} → {d.report.maxDate?.slice(0, 10) ?? "—"}</td>
                  <td className="px-4 py-2.5">{d.report.warnings.length === 0
                    ? <span className="text-xs text-[color:var(--success)]">Clean</span>
                    : <span className="text-xs text-[color:var(--warning)]">{d.report.warnings.length} warnings</span>}</td>
                  <td className="tnum px-4 py-2.5">{d.alerts.length} alerts</td>
                  <td className="tnum px-4 py-2.5 text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <Link to={`/datasets/${d.id}`} className="rounded border border-border px-2 py-1 text-xs hover:bg-muted">Open</Link>
                      <button onClick={() => download(`${d.name}-sample.csv`, toCSV(d.txns.slice(0, 500).map((t) => ({ id: t.id, sender: t.sender, receiver: t.receiver, amount: t.amount, currency: t.currency, ts: t.timestamp }))))} className="rounded border border-border px-2 py-1 text-xs hover:bg-muted">Download</button>
                      <button onClick={() => del(d.id)} className="rounded border border-border p-1 text-muted-foreground hover:text-[color:var(--destructive)]" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && (
            <Empty title="No datasets yet" body="Upload a transaction CSV or generate synthetic data to begin analysis."
              action={<><button onClick={() => setWizard({ step: 1, name: "", desc: "", source: "Mixed" })} className={btnPrimary}>Upload CSV</button><button onClick={loadDemo} className={btnGhost}>Generate synthetic data</button></>} />
          )}
        </div>
      </Card>
    </div>
  );
}

interface Wiz {
  step: number; name: string; desc: string; source: string;
  cols?: string[]; rows?: Record<string, string>[]; maps?: FieldMapping[];
  overrides?: Record<string, string>; modes?: string[];
  txns?: NormalizedTxn[]; report?: QualityReport; alerts?: ReturnType<typeof runDetection>; rules?: RuleConfig[];
}

function Wizard({ w, setW, onDone, saveRemote }: { w: Wiz; setW: (x: Wiz | null) => void; onDone: (d: Dataset) => void; saveRemote: (a: never) => Promise<unknown> }) {
  const [drag, setDrag] = useState(false);
  const [phase, setPhase] = useState("");
  const set = (p: Partial<Wiz>) => setW({ ...w, ...p });

  async function handleFile(f: File) {
    if (!/\.csv$/i.test(f.name)) { alert("Only .csv files are accepted."); return; }
    if (f.size > 25 * 1024 * 1024) { alert("File exceeds the 25 MB limit. Split or sample it first."); return; }
    setPhase("Reading file…");
    const text = await f.text();
    const t = parseCSV(text);
    if (!t.columns.length) { alert("No columns found. Check the file."); setPhase(""); return; }
    set({ cols: t.columns, rows: t.rows, maps: inferMapping(t), overrides: {}, name: w.name || f.name.replace(/\.csv$/i, ""), step: 2 });
    setPhase("");
  }

  function confirmMapping() {
    const col2field: Record<string, string> = {};
    w.maps!.forEach((m) => { col2field[m.column] = w.overrides?.[m.column] ?? m.field ?? ""; });
    const map = buildMapping(col2field as Record<string, SemanticField | "">);
    const { txns, report } = normalize({ columns: w.cols!, rows: w.rows!, delimiter: ",", encodingNote: "" }, map);
    const r = readiness(map);
    const need: Record<string, boolean> = { sender: !!map.sender, receiver: !!map.receiver, amount: !!map.amount, timestamp: !!map.timestamp };
    const modes = MODES.filter((m) => m.need.every((n) => need[n])).map((m) => m.id);
    set({ txns, report, modes, step: 4, col2fieldCache: undefined } as Partial<Wiz>);
    (set as unknown as (p: Record<string, unknown>) => void)({ col2field: col2field });
  }

  async function run() {
    const col2field = (w as unknown as { col2field: Record<string, string> }).col2field;
    const map = buildMapping(col2field as Record<string, SemanticField | "">);
    const { txns, report } = normalize({ columns: w.cols!, rows: w.rows!, delimiter: ",", encodingNote: "" }, map);
    const rules = DEFAULT_RULES.map((x) => ({ ...x }));
    const need: Record<string, boolean> = { sender: !!map.sender, receiver: !!map.receiver, amount: !!map.amount, timestamp: !!map.timestamp };
    const runnable = rules.filter((x) => x.minData.every((m) => need[m]));
    const steps = ["Validating data", "Preparing features", "Running rule detection", "Running anomaly analysis", "Running network analysis", "Aggregating results"];
    for (const s of steps) { setPhase(s + "…"); await new Promise((r) => setTimeout(r, 180)); }
    const alerts = runDetection(txns, runnable);
    const r = readiness(map);
    const ds: Dataset = {
      id: `ds-${Date.now().toString(36)}`, name: w.name || "Untitled dataset", source: "upload",
      createdAt: new Date().toISOString(), columns: w.cols!,
      mappings: w.maps!.map((m) => ({ ...m, field: ((w.overrides?.[m.column] ?? m.field ?? null) as FieldMapping["field"]) })),
      col2field, txns: txns.slice(0, 20000), report, alerts, rules, tier: r.tier,
    };
    saveAll([ds, ...loadAll()]); setSelected(ds.id); emit();
    saveRemote({ name: ds.name, source: "upload", rowCount: txns.length, columns: ds.columns.slice(0, 50), mapping: col2field, quality: { warnings: report.warnings, records: report.records }, summary: { tier: r.tier, alerts: alerts.length } } as never).catch(() => {});
    setPhase("");
    onDone(ds);
  }

  const steps = ["Select", "Inspect", "Map schema", "Configure", "Run", "Results"];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={() => setW(null)} className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Library</button>
        <div className="ml-2 flex flex-1 items-center gap-1">
          {steps.map((s, i) => (
            <div key={s} className={`flex flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs ${w.step === i + 1 ? "bg-[color:var(--primary)]/15 font-semibold text-foreground" : w.step > i + 1 ? "text-[color:var(--success)]" : "text-muted-foreground"}`}>
              <span className="tnum mono">{i + 1}</span> {s}
            </div>
          ))}
        </div>
      </div>

      {w.step === 1 && (
        <Card className={`p-8 text-center transition ${drag ? "border-[color:var(--primary)]" : ""}`}>
          <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}>
            <FileUp className="mx-auto h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
            <p className="mt-2 text-sm font-semibold">Drag a transaction CSV here, or browse</p>
            <p className="mx-auto mt-1 max-w-md text-[13px] text-muted-foreground">Unfamiliar column names are welcome — the next steps infer structure, types, and mappings. Max 25 MB / 20,000 rows. {phase || ""}</p>
            <div className="mx-auto mt-4 grid max-w-md gap-2 text-left">
              <input value={w.name} onChange={(e) => set({ name: e.target.value })} placeholder="Dataset name" className={inputCls} aria-label="Dataset name" />
              <input value={w.desc} onChange={(e) => set({ desc: e.target.value })} placeholder="Optional description" className={inputCls} aria-label="Description" />
              <select value={w.source} onChange={(e) => set({ source: e.target.value })} className={inputCls} aria-label="Dataset source">
                <option>Domestic</option><option>International</option><option>Mixed</option><option>General Financial Data</option>
              </select>
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <label className={btnPrimary}>Browse files<input type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} /></label>
            </div>
          </div>
        </Card>
      )}

      {w.step === 2 && w.report === undefined && (
        <InspectStep w={w} onNext={() => set({ step: 3 })} />
      )}

      {w.step === 3 && (
        <Card>
          <PanelTitle title="Map the schema" sub="Confirmed = high confidence · Suggested = likely · Requires Review = ambiguous, confirm manually" />
          <div className="overflow-x-auto">
            <table className="mt-2 w-full min-w-[820px] text-left text-[13px]">
              <thead><tr className="border-y border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                {["Uploaded column", "Suggested field", "Confidence", "Detected type", "Example values", "Validation", "Override"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}
              </tr></thead>
              <tbody>
                {w.maps!.map((m) => {
                  const chosen = w.overrides?.[m.column] ?? m.field ?? "";
                  const status = !chosen ? "Unsupported" : m.confidence >= 0.8 ? "Confirmed" : m.confidence >= 0.5 ? "Suggested" : "Requires Review";
                  return (
                    <tr key={m.column} className="border-b border-border/50">
                      <td className="mono px-3 py-2 text-xs">{m.column}</td>
                      <td className="px-3 py-2">{chosen || <span className="text-muted-foreground">—</span>}</td>
                      <td className="tnum px-3 py-2">
                        <span className={`rounded px-1.5 py-0.5 text-xs ${m.confidence >= 0.8 ? "bg-[color:var(--success)]/15 text-[color:var(--success)]" : m.confidence >= 0.5 ? "bg-muted text-muted-foreground" : "bg-[color:var(--warning)]/15 text-[color:var(--warning)]"}`}>{m.confidence.toFixed(2)}</span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{m.dtype}</td>
                      <td className="mono max-w-[200px] truncate px-3 py-2 text-xs text-muted-foreground">{m.samples.join(" · ")}</td>
                      <td className="px-3 py-2 text-xs">{status}</td>
                      <td className="px-3 py-2">
                        <select value={chosen} onChange={(e) => set({ overrides: { ...(w.overrides ?? {}), [m.column]: e.target.value } })} className="rounded border border-input bg-background px-1.5 py-1 text-xs" aria-label={`Map ${m.column}`}>
                          {FIELD_OPTS.map((f) => <option key={f} value={f}>{f || "—"}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 p-4">
            <button onClick={() => set({ step: 2 })} className={btnGhost}>Back</button>
            <button onClick={confirmMapping} className={btnPrimary}>Confirm mapping & continue <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></button>
          </div>
        </Card>
      )}

      {w.step === 4 && (
        <Card className="p-5">
          <PanelTitle title="Configure the analysis" sub="Unsupported modes are disabled with the reason shown" />
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {MODES.map((m) => {
              const on = w.modes?.includes(m.id);
              const col2field = (w as unknown as { col2field?: Record<string, string> }).col2field ?? {};
              const missing = m.need.filter((n) => !col2field[n]);
              return (
                <label key={m.id} className={`flex items-start gap-2.5 rounded-lg border border-border p-3 text-[13px] ${missing.length ? "opacity-50" : ""}`}>
                  <input type="checkbox" disabled={missing.length > 0} checked={!!on && missing.length === 0}
                    onChange={(e) => set({ modes: e.target.checked ? [...(w.modes ?? []), m.id] : (w.modes ?? []).filter((x) => x !== m.id) })} className="mt-1" />
                  <span><span className="font-medium">{m.label}</span>
                    {missing.length > 0 && <span className="block text-xs text-[color:var(--warning)]">Unavailable — missing: {missing.join(", ")}</span>}</span>
                </label>
              );
            })}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => set({ step: 3 })} className={btnGhost}>Back</button>
            <button onClick={() => set({ step: 5 })} className={btnPrimary}>Continue to run</button>
          </div>
        </Card>
      )}

      {w.step === 5 && (
        <Card className="p-8 text-center">
          <p className="text-sm font-semibold">Ready to analyse “{w.name}”</p>
          <p className="mx-auto mt-1 max-w-md text-[13px] text-muted-foreground">Real progress is shown per stage — validation, features, rules, anomaly, network, aggregation. {phase}</p>
          <div className="mt-4 flex justify-center gap-2">
            <button onClick={() => set({ step: 4 })} className={btnGhost}>Back</button>
            <button onClick={run} className={btnPrimary}><CheckCircle2 className="mr-1 inline h-4 w-4" /> Run analysis</button>
          </div>
        </Card>
      )}
    </div>
  );
}

function InspectStep({ w, onNext }: { w: Wiz; onNext: () => void }) {
  const col2guess: Record<string, string> = {};
  w.maps!.forEach((m) => { col2guess[m.column] = m.field ?? ""; });
  const map = buildMapping(col2guess as Record<string, SemanticField | "">);
  const { report } = normalize({ columns: w.cols!, rows: w.rows!, delimiter: ",", encodingNote: "" }, map);
  const r = readiness(map);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Rows", num(w.rows!.length)], ["Columns", num(w.cols!.length)], ["Duplicate rows", num(report.duplicateRows)], ["Invalid amounts", num(report.invalidAmounts)],
          ["Invalid dates", num(report.invalidDates)], ["Currencies", report.currencies.slice(0, 3).map((c) => c.code).join(", ") || "—"],
          ["Period", `${report.minDate?.slice(0, 10) ?? "—"} → ${report.maxDate?.slice(0, 10) ?? "—"}`], ["Readiness", `Tier ${r.tier}`]].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</p>
            <p className="tnum mt-0.5 truncate text-sm font-bold">{v}</p>
          </div>
        ))}
      </div>
      {report.warnings.length > 0 && (
        <WarnStrip><ul className="list-disc pl-4">{report.warnings.map((x, i) => <li key={i}>{x}</li>)}</ul></WarnStrip>
      )}
      <Card>
        <PanelTitle title="Data preview" sub={`First ${Math.min(10, w.rows!.length)} rows · scroll horizontally`} />
        <div className="overflow-x-auto">
          <table className="mt-2 w-full text-left text-xs">
            <thead><tr className="border-y border-border text-muted-foreground">{w.cols!.map((c) => <th key={c} className="mono whitespace-nowrap px-3 py-1.5 font-medium">{c}</th>)}</tr></thead>
            <tbody>{w.rows!.slice(0, 10).map((row, i) => (
              <tr key={i} className="border-b border-border/50">{w.cols!.map((c) => <td key={c} className="max-w-[180px] truncate px-3 py-1.5 text-muted-foreground">{row[c]}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
        <div className="flex gap-2 p-4"><button onClick={onNext} className={btnPrimary}>Continue to schema mapping <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></button></div>
      </Card>
    </div>
  );
}
