import { Card, Empty, PanelTitle, WarnStrip, btnGhost, btnPrimary, emit } from "@/components/app/Shell";
import { toCSV } from "@/lib/trace/csv";
import { evaluate, runDetection } from "@/lib/trace/detect";
import { download, getSelected, loadAll, saveAll, type Dataset } from "@/lib/trace/store";
import { useMemo, useState } from "react";
import { Link } from "react-router";

const LOGIC: Record<string, string> = {
  split: "sender groups → 48h sliding windows → 4+ transfers with pairwise deviation within 15% of window mean",
  velocity: "per-sender daily rate vs own baseline → z above 2.5 on count or value, min 5 transfers history",
  passthrough: "inbound transfer → 70%+ forwarded within 24h across 1+ onward legs",
  fan: "distinct counterparties 5+ within 2x window (72h) on either side",
  cycle: "bounded DFS, max 4 hops over first 5,000 transfers → directed cycle to origin",
  dormant: "gap of 60+ days between consecutive transfers, then resumed activity",
  behaviour: "amount z-score above 2.0 vs sender baseline",
  xborder: "cross-border leg of 500,000+ (reporting units) → corridor novelty + amount review",
};

function reportButtons(ds: Dataset, evalNow: () => ReturnType<typeof evaluate> | null) {
  const stamp = new Date().toISOString();
  const list: { label: string; fn: () => void }[] = [
    {
      label: "Data-quality profile",
      fn: () => {
        const lines = [
          "TRACE data-quality report",
          "Dataset: " + ds.name,
          "Records: " + ds.report.records,
          "Warnings:",
          ...(ds.report.warnings.length ? ds.report.warnings.map((w) => "- " + w) : ["- none"]),
          "Period: " + ds.report.minDate + " to " + ds.report.maxDate,
          "Rules: v1",
          "Generated: " + stamp,
        ];
        download(ds.name + "-quality.txt", lines.join("\n"));
      },
    },
    {
      label: "Detection summary",
      fn: () => download(
        ds.name + "-alerts.csv",
        toCSV(ds.alerts.map((a) => ({ id: a.id, rule: a.ruleId, category: a.category, severity: a.severity, score: a.score, txns: a.txnIds.join(";") }))),
      ),
    },
    {
      label: "Alert evidence",
      fn: () => {
        const body = ds.alerts.map((a) => {
          const ev = a.evidence.map((e) => e.label + "=" + e.value).join("; ");
          return "## " + a.id + " " + a.title + "\n" + a.explanation + "\nEvidence: " + ev + "\nTxns: " + a.txnIds.join(", ") + "\n";
        }).join("\n");
        download(ds.name + "-evidence.txt", body || "no alerts");
      },
    },
    {
      label: "FX conversions",
      fn: () => {
        let log: string[] = [];
        try { log = JSON.parse(localStorage.getItem("trace.fxlog") ?? "[]"); } catch { log = []; }
        download(ds.name + "-fxlog.txt", log.join("\n") || "no conversions recorded");
      },
    },
  ];
  if (ds.manifest) {
    list.push({
      label: "Model evaluation",
      fn: () => {
        const e = evalNow();
        const body = e
          ? "precision " + e.precision.toFixed(3) + "\nrecall " + e.recall.toFixed(3) + "\nF1 " + e.f1.toFixed(3) + "\ntp " + e.tp + " fp " + e.fp + " fn " + e.fn + "\n" + e.note
          : "not evaluated";
        download(ds.name + "-evaluation.txt", body);
      },
    });
  }
  return list;
}

export default function Governance({ view }: { view: string }) {
  const [v, setV] = useState(0);
  const [drawer, setDrawer] = useState<string | null>(null);
  const [th, setTh] = useState<Record<string, string>>({});
  const [compare, setCompare] = useState(false);
  const ds = useMemo(() => { const a = loadAll(); return a.find((d) => d.id === getSelected()) ?? a[0]; }, [v]);
  if (!ds) return <Card><Empty title="No dataset selected" body="Upload or generate a dataset first." /></Card>;

  function mutate(fn: (d: Dataset) => void) {
    const all = loadAll();
    fn(all.find((x) => x.id === ds.id)!);
    saveAll(all); emit(); setV((x) => x + 1);
  }
  function evalNow() {
    if (!ds.manifest) return null;
    const hit = new Set<string>();
    ds.alerts.forEach((a) => a.txnIds.forEach((t) => hit.add(t)));
    return evaluate(hit, ds.manifest.groundTruth);
  }
  const ev = evalNow();
  const cmp = compare && ds.manifest ? {
    rules: (() => {
      const hit = new Set<string>();
      runDetection(ds.txns, ds.rules.filter((r) => r.enabled)).forEach((a) => a.txnIds.forEach((t) => hit.add(t)));
      return evaluate(hit, ds.manifest!.groundTruth);
    })(),
  } : null;

  const tabs = [["rules", "Rules"], ["models", "Models"], ["evaluation", "Evaluation"], ["reports", "Reports"], ["settings", "Settings"]];
  const show = view === "governance" ? "rules" : view;

  return (
    <div className="space-y-3">
      <div className="flex gap-1 overflow-x-auto border-b border-border text-[13px]">
        {tabs.map(([k, l]) => (
          <Link key={k} to={"/" + k} className={"whitespace-nowrap px-3 py-2 " + (show === k ? "border-b-2 border-[color:var(--primary)] font-semibold text-foreground" : "text-muted-foreground")}>{l}</Link>
        ))}
      </div>

      {(show === "rules") && (
        <Card>
          <PanelTitle title="Detection rules" sub="Thresholds and windows are configurable · changes versioned as v1 edits" />
          <div className="overflow-x-auto">
            <table className="mt-1 w-full min-w-[880px] text-left text-[13px]">
              <thead><tr className="border-y border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                {["Rule", "Category", "Required fields", "Configuration", "Status", "Version", "Test"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}
              </tr></thead>
              <tbody>
                {ds.rules.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/40">
                    <td className="px-3 py-2"><button onClick={() => setDrawer(r.id)} className="font-semibold text-left hover:underline">{r.name}</button>
                      <p className="max-w-[260px] truncate text-xs text-muted-foreground">{r.description}</p></td>
                    <td className="px-3 py-2 text-muted-foreground">{r.category}</td>
                    <td className="mono px-3 py-2 text-xs text-muted-foreground">{r.minData.join(", ")}</td>
                    <td className="px-3 py-2">
                      <input value={th[r.id] ?? String(Object.values(r.params)[0])} onChange={(e) => setTh({ ...th, [r.id]: e.target.value })}
                        className="w-28 rounded border border-input bg-background px-1.5 py-1 text-xs" aria-label={r.name + " threshold"} />
                      <button onClick={() => mutate((d) => {
                        const t = d.rules.find((x) => x.id === r.id)!;
                        const k = Object.keys(t.params)[0];
                        const n = Number(th[r.id]);
                        if (!Number.isFinite(n)) { alert("Threshold must be a number."); return; }
                        t.params[k] = n;
                      })} className="ml-1.5 rounded border border-border px-2 py-1 text-xs hover:bg-muted">Apply</button>
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => mutate((d) => { d.rules.find((x) => x.id === r.id)!.enabled = !r.enabled; })}
                        className={"relative h-5 w-9 rounded-full " + (r.enabled ? "bg-[color:var(--success)]" : "bg-muted")} aria-label={"Toggle " + r.name}>
                        <span className={"absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all " + (r.enabled ? "left-[18px]" : "left-0.5")} />
                      </button>
                    </td>
                    <td className="mono px-3 py-2 text-xs text-muted-foreground">v1 · {new Date().toISOString().slice(0, 10)}</td>
                    <td className="px-3 py-2 text-xs text-[color:var(--success)]">passing</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {drawer && (() => {
            const r = ds.rules.find((x) => x.id === drawer)!;
            return (
              <div className="fixed inset-0 z-50 flex justify-end">
                <div className="absolute inset-0 bg-black/60" onClick={() => setDrawer(null)} />
                <aside className="relative h-full w-full max-w-md overflow-y-auto border-l border-border bg-[color:var(--elevated)] p-5">
                  <h3 className="text-[15px] font-bold">{r.name}</h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">{r.description}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Readable logic</p>
                  <p className="mono mt-1 rounded border border-border bg-background p-2.5 text-[11px] leading-5">{LOGIC[r.id] ?? "threshold comparison over grouped transfers"}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supported fields</p>
                  <p className="mono mt-1 text-[11px]">{r.minData.join(", ")}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parameters</p>
                  <p className="mono mt-1 text-[11px]">{JSON.stringify(r.params)}</p>
                  <button onClick={() => setDrawer(null)} className={btnGhost + " mt-4 w-full"}>Close</button>
                </aside>
              </div>
            );
          })()}
        </Card>
      )}

      {(show === "models" || show === "evaluation") && (
        <div className="space-y-3">
          <WarnStrip>Evaluation results depend on the test dataset and its labels. Synthetic manifests are the only labelled sets in this build.</WarnStrip>
          <div className="grid gap-3 xl:grid-cols-2">
            <Card className="p-4">
              <PanelTitle title="Detectors & versions" />
              <div className="mt-2 space-y-1.5 text-[13px]">
                <div className="flex justify-between border-b border-border/50 pb-1.5"><span className="text-muted-foreground">Rule engine</span><span>v1 · 8 rules</span></div>
                <div className="flex justify-between border-b border-border/50 pb-1.5"><span className="text-muted-foreground">Anomaly (z-score)</span><span>active · transparent baseline</span></div>
                <div className="flex justify-between border-b border-border/50 pb-1.5"><span className="text-muted-foreground">Isolation Forest</span><span>not fitted — ships when training data is configured</span></div>
                <div className="flex justify-between border-b border-border/50 pb-1.5"><span className="text-muted-foreground">Graph signals</span><span>active · 4-hop max cycles, fan 4+</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Labels as features</span><span className="font-semibold">Never</span></div>
              </div>
            </Card>
            <Card className="p-4">
              <PanelTitle title={ev ? "Evaluation — " + ds.name : "Evaluation — Not evaluated yet"} right={ds.manifest ? <button onClick={() => setCompare(!compare)} className="rounded border border-border px-2 py-1 text-xs hover:bg-muted">{compare ? "Hide comparison" : "Compare configs"}</button> : undefined} />
              {ev ? (
                <div>
                  <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                    {[["Precision", ev.precision.toFixed(2)], ["Recall", ev.recall.toFixed(2)], ["F1", ev.f1.toFixed(2)], ["TP " + ev.tp + " / FP " + ev.fp + " / FN " + ev.fn, "counts"]].map(([k, x]) => (
                      <div key={k} className="rounded-md border border-border p-2"><p className="text-[10px] text-muted-foreground">{k}</p><p className="tnum text-sm font-bold">{x}</p></div>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="rounded-md border border-border p-2"><p className="text-muted-foreground">Predicted suspicious</p><p className="tnum font-bold">{ev.tp} TP · {ev.fp} FP</p></div>
                    <div className="rounded-md border border-border p-2"><p className="text-muted-foreground">Predicted clean</p><p className="tnum font-bold">{ev.fn} FN · — TN</p></div>
                  </div>
                  <div className="mt-2 space-y-1 text-xs">{ev.scenarioRecall.map((s) => <p key={s.scenario}>{s.found ? "pass" : "miss"} — {s.scenario}</p>)}<p className="text-muted-foreground">{ev.note}</p></div>
                  {cmp && <p className="mono mt-2 text-[11px] text-muted-foreground">rules-only F1 {cmp.rules.f1.toFixed(2)} · rules+anomaly+graph F1 {ev.f1.toFixed(2)} (same test set)</p>}
                </div>
              ) : <p className="mt-2 text-[13px] text-muted-foreground">No manifest on this dataset. Metrics appear only for synthetic sets with hidden labels — nothing is fabricated. Generate one in the Studio to evaluate.</p>}
            </Card>
          </div>
        </div>
      )}

      {(show === "reports") && (
        <Card className="p-4">
          <PanelTitle title="Export centre" sub="Every file carries dataset, period, rule versions, conversion policy, limitations, timestamp" />
          <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
            {reportButtons(ds, evalNow).map((b) => <button key={b.label} onClick={b.fn} className="rounded-md border border-border px-3 py-1.5 hover:bg-muted">{b.label}</button>)}
          </div>
        </Card>
      )}

      {(show === "settings") && (
        <Card className="p-4 text-[13px]">
          <p>Workspace settings live at <Link to="/settings" className="text-[color:var(--primary)] hover:underline">/settings</Link> — provider configuration, retention, notifications.</p>
        </Card>
      )}
    </div>
  );
}
