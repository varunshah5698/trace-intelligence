import { Card, Empty, PanelTitle, btnGhost, btnPrimary, emit, inputCls, num } from "@/components/app/Shell";
import { inferMapping, normalize, buildMapping } from "@/lib/trace/csv";
import { DEFAULT_RULES, runDetection } from "@/lib/trace/detect";
import { generate, specFromPrompt, type GenSpec } from "@/lib/trace/synthetic";
import { download, loadAll, saveAll, setSelected, type Dataset } from "@/lib/trace/store";
import { announceAnalysis } from "@/lib/trace/ml";
import { Download, FlaskConical, Play, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

export default function Studio() {
  const nav = useNavigate();
  const [spec, setSpec] = useState<GenSpec>({ name: "Retail domestic + cases", count: 2000, accounts: 100, mode: "mixed", days: 90, seed: 42, splitting: 2, passthrough: 1, circular: 1 });
  const [format, setFormat] = useState("CSV + manifest");
  const [prompt, setPrompt] = useState("Generate a synthetic Indian transaction dataset containing legitimate domestic payments, several international transfers, a transaction-splitting scenario, a pass-through intermediary and a circular payment path.");
  const [preview, setPreview] = useState<ReturnType<typeof generate> | null>(null);
  const set = (k: keyof GenSpec, v: number | string) => setSpec({ ...spec, [k]: v });

  const planted = spec.splitting * 5 + spec.passthrough * 3 + spec.circular * 3;
  const summary = useMemo(() => [
    ["Records", num(spec.count)], ["Accounts", num(spec.accounts)],
    ["Mix", spec.mode], ["Planted transfers", num(Math.min(planted, spec.count))],
    ["Seed", String(spec.seed)], ["Output", format],
  ], [spec, format, planted]);

  function persist(g: ReturnType<typeof generate>, runDetect: boolean) {
    const cols = Object.keys(g.txns[0].raw);
    const t = { columns: cols, rows: g.txns.map((x) => x.raw as Record<string, string>), delimiter: ",", encodingNote: "" };
    const m = inferMapping(t);
    const c2f: Record<string, string> = {};
    m.forEach((x) => { c2f[x.column] = x.field ?? ""; });
    const norm = normalize(t, buildMapping(c2f as never));
    const alerts = runDetect ? announceAnalysis("studio — " + spec.name, runDetection(norm.txns, DEFAULT_RULES.map((x) => ({ ...x })))) : [];
    const ds: Dataset = {
      id: `ds-${Date.now().toString(36)}`, name: `${spec.name} (synthetic, labelled)`, source: "synthetic",
      createdAt: new Date().toISOString(), columns: cols, mappings: m, col2field: c2f,
      txns: norm.txns, report: norm.report, alerts, rules: DEFAULT_RULES.map((x) => ({ ...x })),
      manifest: g.manifest, tier: 1,
    };
    saveAll([ds, ...loadAll()]); setSelected(ds.id); emit();
    return ds;
  }

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {/* left: configuration */}
      <Card className="p-5">
        <PanelTitle title="Dataset configuration" sub="Deterministic — same seed reproduces the same ledger" />
        <div className="mt-3 grid grid-cols-2 gap-2.5 text-[13px]">
          <label className="col-span-2 text-xs text-muted-foreground">Dataset name<input value={spec.name} onChange={(e) => set("name", e.target.value)} className={`${inputCls} mt-1`} /></label>
          <label className="text-xs text-muted-foreground">Transactions<input type="number" value={spec.count} min={100} max={20000} onChange={(e) => set("count", +e.target.value)} className={`${inputCls} mt-1`} /></label>
          <label className="text-xs text-muted-foreground">Accounts & companies<input type="number" value={spec.accounts} min={10} max={1000} onChange={(e) => set("accounts", +e.target.value)} className={`${inputCls} mt-1`} /></label>
          <label className="text-xs text-muted-foreground">Activity<select value={spec.mode} onChange={(e) => set("mode", e.target.value)} className={`${inputCls} mt-1`}><option value="domestic">Domestic</option><option value="international">International</option><option value="mixed">Mixed</option></select></label>
          <label className="text-xs text-muted-foreground">Observation days<input type="number" value={spec.days} min={7} max={365} onChange={(e) => set("days", +e.target.value)} className={`${inputCls} mt-1`} /></label>
          <label className="text-xs text-muted-foreground">Random seed<input type="number" value={spec.seed} onChange={(e) => set("seed", +e.target.value)} className={`${inputCls} mt-1`} /></label>
          <label className="text-xs text-muted-foreground">Splitting scenarios<input type="number" value={spec.splitting} min={0} max={10} onChange={(e) => set("splitting", +e.target.value)} className={`${inputCls} mt-1`} /></label>
          <label className="text-xs text-muted-foreground">Pass-through<input type="number" value={spec.passthrough} min={0} max={10} onChange={(e) => set("passthrough", +e.target.value)} className={`${inputCls} mt-1`} /></label>
          <label className="text-xs text-muted-foreground">Circular<input type="number" value={spec.circular} min={0} max={10} onChange={(e) => set("circular", +e.target.value)} className={`${inputCls} mt-1`} /></label>
          <label className="text-xs text-muted-foreground">Output format<select value={format} onChange={(e) => setFormat(e.target.value)} className={`${inputCls} mt-1`}><option>CSV + manifest</option><option>CSV only</option><option>Manifest only</option></select></label>
        </div>
        <div className="mt-3 rounded-lg border border-border bg-background p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold"><Sparkles className="h-3.5 w-3.5 text-[color:var(--primary)]" /> Describe what you need</p>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className={`${inputCls} mt-2 leading-6`} />
          <button onClick={() => { const s = specFromPrompt(prompt); s.name = spec.name; setSpec(s); setPreview(generate(s)); }} className={`${btnGhost} mt-2`}>Convert to spec & generate</button>
          <p className="mt-2 text-[11px] text-muted-foreground">Template parser in this build (works offline). Generation is always deterministic code — never raw model CSV.</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setPreview(generate(spec))} className={btnPrimary}><Play className="mr-1 inline h-3.5 w-3.5" /> Generate Dataset</button>
          <button onClick={() => { setPreview(null); }} className={btnGhost}><RotateCcw className="mr-1 inline h-3.5 w-3.5" /> Reset</button>
        </div>
      </Card>

      {/* right: live summary + preview */}
      <div className="space-y-3">
        <Card className="p-5">
          <PanelTitle title="Live configuration summary" sub="Updates as you edit" />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {summary.map(([k, v]) => (
              <div key={k} className="rounded-md border border-border bg-background px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</p>
                <p className="tnum truncate text-sm font-bold">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 h-16 rounded-md border border-border bg-background p-2">
            <VisualBars spec={spec} />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><FlaskConical className="h-3.5 w-3.5" /> Channels UPI · IMPS · NEFT · RTGS · bank transfer · card · wallet — labels describe records, not live rails.</p>
        </Card>
        <Card>
          {preview ? (
            <div className="p-5">
              <PanelTitle title={`Preview — ${num(preview.txns.length)} records`} sub={`${preview.manifest.scenarios.length} planted scenarios · manifest ${format === "CSV only" ? "withheld from download" : "available"}`} />
              <div className="mt-2 space-y-1.5 text-[13px]">
                {preview.manifest.scenarios.map((s, i) => <p key={i} className="text-muted-foreground"><span className="font-semibold text-foreground">{s.kind}:</span> {s.description}</p>)}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {format !== "Manifest only" && <button onClick={() => download(`${spec.name}.csv`, preview.csv)} className={btnGhost}><Download className="mr-1 inline h-3.5 w-3.5" /> Download CSV</button>}
                {format !== "CSV only" && <button onClick={() => download(`${spec.name}-manifest.json`, JSON.stringify(preview.manifest, null, 2), "application/json")} className={btnGhost}><Download className="mr-1 inline h-3.5 w-3.5" /> Manifest</button>}
                <button onClick={() => { const ds = persist(preview, false); nav(`/datasets/${ds.id}`); }} className={btnGhost}>Save to Workspace</button>
                <button onClick={() => { const ds = persist(preview, true); nav(`/detections`); }} className={btnPrimary}>Run Detection</button>
                <button onClick={() => { const ds = persist(preview, true); setSelected(ds.id); emit(); nav(`/evaluation`); }} className={btnGhost}>Evaluate</button>
              </div>
              <p className="mono mt-3 text-[11px] text-muted-foreground">schema: transaction_id, sender, receiver, amount, currency, timestamp, channel, origin_country, destination_country, purpose</p>
            </div>
          ) : (
            <Empty title="No scenario yet" body="Configure the ledger on the left, or describe it in plain language, then generate." />
          )}
        </Card>
      </div>
    </div>
  );
}

function VisualBars({ spec }: { spec: GenSpec }) {
  const parts = [
    { k: "legit", v: Math.max(1, spec.count - spec.splitting * 5 - spec.passthrough * 3 - spec.circular * 3), c: "#5B8CFF" },
    { k: "split", v: spec.splitting * 5, c: "#F4B544" },
    { k: "pass", v: spec.passthrough * 3, c: "#26C6B8" },
    { k: "cyc", v: spec.circular * 3, c: "#F05252" },
  ];
  const tot = Math.max(1, parts.reduce((s, p) => s + p.v, 0));
  return (
    <div className="flex h-full items-end gap-1" aria-hidden>
      {parts.map((p) => <div key={p.k} className="flex-1 rounded-sm" title={`${p.k}: ${p.v}`} style={{ height: `${Math.max(6, (p.v / tot) * 100)}%`, background: p.c, opacity: 0.85 }} />)}
    </div>
  );
}
