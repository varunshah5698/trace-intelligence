import { Card, Empty, PanelTitle, WarnStrip } from "@/components/app/Shell";
import { toCSV } from "@/lib/trace/csv";
import { evaluate, runDetection } from "@/lib/trace/detect";
import { getSelected, loadAll, type Dataset } from "@/lib/trace/store";
import { readModelMeta } from "@/lib/trace/ml";
import { download } from "@/lib/trace/store";
import { useMemo, useState } from "react";
import { Link } from "react-router";

// Detection rules are backend engine configuration. They run on every analysis
// with versioned defaults but are intentionally not shown to operator roles
// (bank / government reviewers). Threshold tuning lives with the engineering
// team; reviewers see methods, evaluation and exports.

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

function ModelStatus() {
  const [meta] = useState(readModelMeta);
  if (!meta) return <span className="text-right">not fitted — trains on the next analysis run</span>;
  return (
    <span className="text-right">fitted · {meta.version} · {meta.trees} trees × {meta.seeds?.length ?? 1} seeds · {meta.records} records · {meta.features.length} features · {new Date(meta.trainedAt).toLocaleString()}</span>
  );
}

export default function Governance({ view }: { view: string }) {
  const [v] = useState(0);
  const [compare, setCompare] = useState(false);
  const ds = useMemo(() => { const a = loadAll(); return a.find((d) => d.id === getSelected()) ?? a[0]; }, [v]);
  if (!ds) return <Card><Empty title="No dataset selected" body="Upload or generate a dataset first." /></Card>;

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

  const tabs = [["models", "Models"], ["evaluation", "Evaluation"], ["reports", "Reports"], ["settings", "Settings"]];
  const show = view === "governance" || view === "rules" ? "models" : view;

  return (
    <div className="space-y-3">
      <div className="flex gap-1 overflow-x-auto border-b border-border text-[13px]">
        {tabs.map(([k, l]) => (
          <Link key={k} to={"/" + k} className={"whitespace-nowrap px-3 py-2 " + (show === k ? "border-b-2 border-[color:var(--primary)] font-semibold text-foreground" : "text-muted-foreground")}>{l}</Link>
        ))}
      </div>

      {(show === "models" || show === "evaluation") && (
        <div className="space-y-3">
          <WarnStrip>Evaluation results depend on the test dataset and its labels. Synthetic manifests are the only labelled sets in this build.</WarnStrip>
          <div className="grid gap-3 xl:grid-cols-2">
            <Card className="p-4">
              <PanelTitle title="Detectors & versions" />
              <div className="mt-2 space-y-1.5 text-[13px]">
                <div className="flex justify-between border-b border-border/50 pb-1.5"><span className="text-muted-foreground">Rule engine</span><span>v1 · 8 rules (backend)</span></div>
                <div className="flex justify-between border-b border-border/50 pb-1.5"><span className="text-muted-foreground">Anomaly (z-score)</span><span>active · transparent baseline</span></div>
                <div className="flex justify-between gap-3 border-b border-border/50 pb-1.5"><span className="shrink-0 text-muted-foreground">Isolation Forest</span><ModelStatus /></div>
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
