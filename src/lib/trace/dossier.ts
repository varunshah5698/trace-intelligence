// Dataset dossier: the full context handed to North Mini before it analyses a
// dataset. Every number here is computed by the platform from the actual rows —
// synthetic and uploaded alike — so the model can only quote what exists.
// Nothing is rounded away or invented; formatting stays raw so the backend's
// figure-verification pass can match cited numbers against these exact values.

import type { NormalizedTxn } from "./csv";
import type { Dataset } from "./store";

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Value statistics per currency, computed from the transactions themselves. */
function valueStats(txns: NormalizedTxn[]) {
  const byCur = new Map<string, number[]>();
  txns.forEach((t) => {
    const arr = byCur.get(t.currency) ?? [];
    arr.push(t.amount);
    byCur.set(t.currency, arr);
  });
  return [...byCur.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([currency, amounts]) => {
      const sorted = [...amounts].sort((a, b) => a - b);
      const total = amounts.reduce((s, x) => s + x, 0);
      return {
        currency,
        count: amounts.length,
        total: round2(total),
        mean: round2(total / amounts.length),
        median: round2(quantile(sorted, 0.5)),
        p95: round2(quantile(sorted, 0.95)),
        min: sorted[0],
        max: sorted[sorted.length - 1],
      };
    });
}

/** Most-funded and most-draining accounts, exact aggregates. */
function accountFlows(txns: NormalizedTxn[]) {
  const inflow = new Map<string, { value: number; n: number }>();
  const outflow = new Map<string, { value: number; n: number }>();
  txns.forEach((t) => {
    const i = inflow.get(t.receiver) ?? { value: 0, n: 0 };
    i.value += t.amount; i.n++;
    inflow.set(t.receiver, i);
    const o = outflow.get(t.sender) ?? { value: 0, n: 0 };
    o.value += t.amount; o.n++;
    outflow.set(t.sender, o);
  });
  const top = (m: Map<string, { value: number; n: number }>) =>
    [...m.entries()]
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 8)
      .map(([account, v]) => ({ account, value: round2(v.value), txns: v.n }));
  return { top_inflows: top(inflow), top_outflows: top(outflow) };
}

/** One alert, condensed but with its real evidence and score. */
function alertBrief(a: Dataset["alerts"][number]) {
  return {
    id: a.id,
    rule: a.ruleId,
    category: a.category,
    severity: a.severity,
    score: Math.round(a.score),
    entities: a.entities.slice(0, 6),
    evidence: a.evidence.slice(0, 6),
    transactions: a.txnIds.length,
    explanation: a.explanation,
  };
}

function sampleRows(txns: NormalizedTxn[], n: number) {
  return txns.slice(0, n).map((t) => ({
    id: t.id,
    from: t.sender,
    to: t.receiver,
    amount: t.amount,
    currency: t.currency,
    time: t.timestamp,
    channel: t.channel,
    route: `${t.origin_country}→${t.dest_country}`,
    purpose: t.purpose,
    status: t.status,
  }));
}

/** Full analysis dossier for a single dataset (synthetic or uploaded). */
export function datasetDossier(ds: Dataset): Record<string, unknown> {
  const txns = ds.txns;
  const domestic = txns.filter((t) => t.origin_country === "IN" && t.dest_country === "IN");
  const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  ds.alerts.forEach((a) => { bySeverity[a.severity] = (bySeverity[a.severity] ?? 0) + 1; });
  const byRule = new Map<string, number>();
  ds.alerts.forEach((a) => byRule.set(a.ruleId, (byRule.get(a.ruleId) ?? 0) + 1));
  const topAlerts = [...ds.alerts]
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(alertBrief);

  const mapped = ds.mappings
    .filter((m) => m.field && m.field !== "ignore")
    .map((m) => `${m.column} → ${m.field}`);

  const dossier: Record<string, unknown> = {
    dataset: {
      name: ds.name,
      origin: ds.manifest ? "synthetic (generated in-platform, with ground-truth manifest)"
        : ds.source === "upload" ? "non-synthetic (user-uploaded CSV)" : ds.source,
      created: ds.createdAt,
      readiness_tier: ds.tier,
      records: txns.length,
      source_columns: ds.columns.length,
      period: { from: ds.report.minDate, to: ds.report.maxDate },
      semantic_mapping: mapped,
    },
    data_quality: {
      warnings: ds.report.warnings,
      duplicate_rows: ds.report.duplicateRows,
      duplicate_ids: ds.report.duplicateIds,
      invalid_amounts: ds.report.invalidAmounts,
      invalid_dates: ds.report.invalidDates,
      bad_currencies: ds.report.badCurrencies,
      missingness_top: ds.report.missingByColumn
        .filter((m) => m.pct > 0)
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 8)
        .map((m) => ({ column: m.column, missing_pct: m.pct })),
      currencies: ds.report.currencies,
      channels: ds.report.channels,
    },
    value_statistics: valueStats(txns),
    flows: {
      unique_senders: new Set(txns.map((t) => t.sender)).size,
      unique_receivers: new Set(txns.map((t) => t.receiver)).size,
      domestic: { count: domestic.length, value: round2(domestic.reduce((s, t) => s + t.amount, 0)) },
      cross_border: { count: txns.length - domestic.length, value: round2(txns.reduce((s, t) => s + t.amount, 0) - domestic.reduce((s, t) => s + t.amount, 0)) },
      ...accountFlows(txns),
    },
    detection_output: {
      alerts_total: ds.alerts.length,
      by_severity: bySeverity,
      by_rule: [...byRule.entries()].map(([rule, n]) => ({ rule, n })).sort((a, b) => b.n - a.n),
      rules_enabled: ds.rules.filter((r) => r.enabled).map((r) => r.id),
      top_alerts: topAlerts,
    },
    sample_transactions: sampleRows(txns, 25),
  };

  if (ds.manifest) {
    const tiers: Record<string, number> = { clean: 0, low: 0, medium: 0, high: 0 };
    ds.manifest.personas?.forEach((p) => { tiers[p.tier] = (tiers[p.tier] ?? 0) + 1; });
    dossier.ground_truth_manifest = {
      note: "Synthetic dataset: planted scenarios and persona tiers are documented ground truth for evaluation, not guesses.",
      seed: ds.manifest.seed,
      scenarios: ds.manifest.scenarios.map((s) => ({ kind: s.kind, description: s.description, transactions: s.txnIds.length })),
      labelled_transfers: ds.manifest.groundTruth.length,
      persona_tiers: tiers,
    };
  }

  return dossier;
}

/** Dossier over the whole library — used by the Datasets screen's AI brief. */
export function libraryDossier(list: Dataset[], activeId: string | null): Record<string, unknown> {
  return {
    library: {
      datasets: list.length,
      total_records: list.reduce((s, d) => s + d.txns.length, 0),
      total_alerts: list.reduce((s, d) => s + d.alerts.length, 0),
      synthetic: list.filter((d) => !!d.manifest).length,
      uploaded: list.filter((d) => d.source === "upload").length,
      active_dataset: list.find((d) => d.id === activeId)?.name ?? null,
    },
    per_dataset: list.map((d) => ({
      name: d.name,
      origin: d.manifest ? "synthetic" : d.source === "upload" ? "uploaded (non-synthetic)" : d.source,
      records: d.txns.length,
      alerts: d.alerts.length,
      critical_high: d.alerts.filter((a) => a.severity === "critical" || a.severity === "high").length,
      quality_warnings: d.report.warnings.length,
      period: { from: d.report.minDate, to: d.report.maxDate },
      tier: d.tier,
    })),
  };
}
