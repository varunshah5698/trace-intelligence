import { generateBalanced } from "./src/lib/trace/synthetic.ts";
import { DEFAULT_RULES, runDetection } from "./src/lib/trace/detect.ts";
import { parseCSV, inferMapping, buildMapping, normalize } from "./src/lib/trace/csv.ts";
const out = generateBalanced();
const table = parseCSV(out.csv);
const maps = inferMapping(table);
const c2f = {}; maps.forEach((m) => { c2f[m.column] = m.field ?? ""; });
const norm = normalize(table, buildMapping(c2f));
const alerts = runDetection(norm.txns, DEFAULT_RULES.map((x) => ({ ...x })));
// print full alert summary for non-ml rules + count ml per entity
for (const a of alerts) {
  if (a.ruleId === "ml") continue;
  console.log(`${a.ruleId}/${a.severity}  ${a.title.slice(0, 70)}  | ents: ${a.entities.slice(0,4).map((e)=>e.slice(0,26)).join(", ")}`);
}
const mlEnts = new Map();
alerts.filter((a) => a.ruleId === "ml").forEach((a) => a.entities.forEach((e) => mlEnts.set(e, (mlEnts.get(e) ?? 0) + 1)));
console.log("\nML alerts:", alerts.filter((a) => a.ruleId === "ml").length, "| distinct entities:", mlEnts.size);
