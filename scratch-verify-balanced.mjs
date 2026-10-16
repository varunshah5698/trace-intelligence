// Scratch verification for generateBalanced() — deleted after the run.
import { generateBalanced } from "./src/lib/trace/synthetic.ts";
import { DEFAULT_RULES, runDetection } from "./src/lib/trace/detect.ts";
import { parseCSV, inferMapping, buildMapping, normalize } from "./src/lib/trace/csv.ts";

let failures = 0;
const ok = (cond, label, extra = "") => {
  if (cond) console.log("PASS", label, extra);
  else { failures++; console.log("FAIL", label, extra); }
};

const out = generateBalanced();
console.log("txns:", out.txns.length, "| personas:", out.personas.length, "| scenarios:", out.manifest.scenarios.length, "| gt:", out.manifest.groundTruth.length);

// 1) CSV round-trip through the app's own import path.
const table = parseCSV(out.csv);
const maps = inferMapping(table);
const c2f = {};
maps.forEach((m) => { c2f[m.column] = m.field ?? ""; });
const norm = normalize(table, buildMapping(c2f));
ok(norm.txns.length === out.txns.length, "CSV round-trip preserves rows", `${norm.txns.length}/${out.txns.length}`);

// 2) Detection with the app's default rules (incl. ML).
const alerts = runDetection(norm.txns, DEFAULT_RULES.map((x) => ({ ...x })));
const byRule = new Map();
alerts.forEach((a) => { if (!byRule.has(a.ruleId)) byRule.set(a.ruleId, []); byRule.get(a.ruleId).push(a); });
console.log("\n--- alerts by rule ---");
for (const [r, list] of [...byRule.entries()].sort()) console.log(`${r}: ${list.length}`);
console.log("total:", alerts.length, "\n");

const RULE_FOR = { "fan-in": "fan", splitting: "split", passthrough: "passthrough", circular: "cycle", dormant: "dormant", xborder: "xborder", velocity: "velocity" };
for (const sc of out.manifest.scenarios) {
  const want = RULE_FOR[sc.kind];
  const hits = (byRule.get(want) ?? []).filter((a) => a.txnIds.some((t) => sc.txnIds.includes(t)));
  ok(hits.length > 0, `scenario ${sc.kind} fires rule ${want}`, hits.length ? `(${hits.length} alert(s))` : "");
}

// 3) Ground-truth recall per scenario kind.
const alertTxns = new Set(alerts.flatMap((a) => a.txnIds));
const byScenario = new Map();
out.manifest.groundTruth.forEach((g) => { if (!byScenario.has(g.scenario)) byScenario.set(g.scenario, []); byScenario.get(g.scenario).push(g.txnId); });
let hit = 0, tot = 0;
for (const [sc, ids] of byScenario) {
  const h = ids.filter((i) => alertTxns.has(i)).length;
  hit += h; tot += ids.length;
  if (h < ids.length) console.log(`  partial recall ${sc}: ${h}/${ids.length}`);
}
ok(hit / tot >= 0.9, "ground-truth recall ≥ 90%", `${hit}/${tot}`);

// 4) Persona tiers as the Entities page computes them (worst severity over ALL alerts).
const lvl = { low: 1, medium: 2, high: 3, critical: 4 };
const worst = new Map();
alerts.forEach((a) => a.entities.forEach((e) => { if (!worst.has(e) || lvl[a.severity] > lvl[worst.get(e)]) worst.set(e, a.severity); }));
const mismatch = [];
const counts = { clean: 0, low: 0, medium: 0, high: 0 };
for (const p of out.personas) {
  const ui = worst.get(p.id) ?? null;
  const want = p.tier === "clean" ? null : p.tier;
  const wantLvl = want ? lvl[want] : 0;
  const uiLvl = ui ? lvl[ui] : 0;
  counts[p.tier]++;
  // tier match: UI risk level equals intended (clean = no alert at all)
  if (uiLvl !== wantLvl) mismatch.push(`${p.tier}→UI:${ui ?? "clean"}  ${p.id.slice(0, 40)}  (${p.why})`);
}
console.log("\n--- persona tier counts ---", counts);
if (mismatch.length) {
  console.log("mismatches (with alerting rules):");
  const idOf = out.personas.map((p) => p.id);
  for (const line of mismatch) {
    const pid = idOf.find((x) => line.includes(x.slice(0, 26)));
    const rules = pid ? [...new Set(alerts.filter((a) => a.entities.includes(pid)).map((a) => `${a.ruleId}/${a.severity}`))].join(", ") : "?";
    console.log("  " + line + "   rules: " + rules);
  }
}
ok(mismatch.length === 0, "every persona's UI risk tier matches its intended label", `${mismatch.length} mismatch(es)`);
ok(counts.clean >= 10, "≥10 clean personas", String(counts.clean));
ok(counts.low >= 1, "≥1 low-risk persona", String(counts.low));
ok(counts.medium >= 3 && counts.high >= 3, "medium+high personas present", `${counts.medium}/${counts.high}`);

// 5) List all alert entities that are NOT personas (unintended collateral alerts).
const personaIds = new Set(out.personas.map((p) => p.id));
const collateral = new Map();
alerts.forEach((a) => a.entities.forEach((e) => { if (!personaIds.has(e)) collateral.set(e, (collateral.get(e) ?? 0) + 1); }));
if (collateral.size) {
  console.log("\nnon-persona entities appearing in alerts:");
  for (const [e, n] of collateral) console.log(`  ${e.slice(0, 48)} ×${n}`);
}

console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL CHECKS PASSED");
process.exit(failures ? 1 : 0);
