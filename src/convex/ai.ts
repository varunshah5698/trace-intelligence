"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { vly } from "../lib/vly-integrations";

/**
 * North Mini (Cohere's North Mini Code) is the sole analysis model for this
 * site. It is reached through the project's AI gateway (`@vly-ai/integrations`,
 * an OpenAI-compatible endpoint). Model ids are tried in order until one is
 * recognised by the gateway, so a slug spelling difference never blocks
 * analysis.
 */
const NORTH_MODELS = [
  "cohere/north-mini-code",
  "cohere/north-mini-code:free",
  "north-mini-code",
];

const SYSTEM = `You are Aegis Intelligence, the analysis engine of the Aegis financial-intelligence platform. Every analysis shown in this product is produced by you (the North Mini model) — there is no other analyst.

You are given structured data computed by the platform (transaction counts, alert severities, entity risk, FX series, dataset profiles, ground-truth manifests, etc.). Rules:
- Base every statement strictly on the supplied data. Never invent figures, ids, or events.
- Numbers you cite must be copied exactly from the data. Do not round, extrapolate, or compute new percentages/averages unless the task explicitly asks you to compute from given values — and when you do compute, say "computed from" so it can be checked.
- If data is missing or thin, say what is missing and what it would take to conclude.
- Be candid about uncertainty; an empty alert list is not proof of legitimacy.
- When a ground-truth manifest is supplied, use it to state what is planted/labelled — that is real evaluation data, not speculation.
- Audience: fraud analysts and compliance officers — direct, professional, no filler.

A verification pass checks every number you write against the supplied data. Figures that are not in the data will be sent back to you for correction.

Format: plain-text markdown. Start with a one-line verdict. Then short sections headed "##" with tight bullets. Keep it under ~350 words unless the task asks for detail.`;

type AiResult = {
  ok: boolean;
  text: string;
  model: string;
  credits?: number;
  error?: string;
  /** Figures in the final text that could not be matched to the supplied data. */
  unverified?: string[];
  /** How many numeric figures were checked against the data. */
  figuresChecked?: number;
};

/* ── Figure verification ────────────────────────────────────────────────
   Every numeric token in the response must map back to a number present in
   the supplied context, allowing for unit formatting (1.2k, 5.99 Cr, 6.4%)
   and rounding. Anything else is a fabricated figure: it is sent back to the
   model once for correction; if it survives, it is reported to the UI. */

const SCALES = [1, 0.01, 1e3, 1e5, 1e6, 1e7, 1e9]; // plain, percent, k, lakh, M, Cr, B

function extractNumbers(s: string): number[] {
  const out: number[] = [];
  const re = /-?\d[\d,]*(?:\.\d+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const n = Number(m[0].replace(/,/g, ""));
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

function matchedIn(r: number, contextNums: number[]): boolean {
  for (const c of contextNums) {
    for (const s of SCALES) {
      const v = r * s;
      const diff = Math.abs(v - c);
      if (diff <= 0.5) return true;
      if (diff / Math.max(Math.abs(c), 1e-9) <= 0.01) return true;
    }
  }
  return false;
}

function unverifiedFigures(text: string, context: string): string[] {
  const contextNums = extractNumbers(context);
  if (!contextNums.length) return [];
  const seen = new Set<string>();
  const bad: string[] = [];
  for (const r of extractNumbers(text)) {
    const key = String(r);
    if (seen.has(key)) continue;
    seen.add(key);
    if (!matchedIn(r, contextNums)) {
      // Prefer the original formatted token for the report.
      bad.push(key);
      if (bad.length >= 20) break;
    }
  }
  return bad;
}

async function callModel(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  temperature: number,
): Promise<{ ok: boolean; text: string; error: string; model: string; credits?: number }> {
  let lastError = "";
  const failures: string[] = [];
  for (const model of NORTH_MODELS) {
    const res = await vly.ai.completion({
      model,
      messages,
      temperature,
      maxTokens: 2000,
    });
    const text = res.data?.choices?.[0]?.message?.content?.trim() ?? "";
    if (res.success && text) return { ok: true, text, error: "", model, credits: res.usage?.credits };
    if (!res.success && res.error) lastError = res.error;
    else if (!text) lastError = "model returned an empty response";
    failures.push(`${model}: ${lastError}`);

    // Retry the next slug only when the failure looks model-specific
    // (unknown/unsupported model). Auth, quota and network errors stop here.
    const modelSpecific = /model|endpoint|not[_ ]found|unsupported|does not exist|404|400/i.test(lastError);
    if (!modelSpecific) break;
  }
  return { ok: false, text: "", error: failures.join(" | ") || "unknown gateway error", model: "north-mini" };
}

async function runAnalysis(task: string, context: string, question?: string): Promise<AiResult> {
  if (!process.env.VLY_INTEGRATION_KEY) {
    return {
      ok: false,
      text: "",
      model: "north-mini",
      error: "AI provider key is not configured for this deployment (VLY_INTEGRATION_KEY). Add it under Keys/API keys to enable North Mini analysis.",
    };
  }

  const user = `Task: ${task}\n\nData:\n${context}${question ? `\n\nQuestion: ${question}` : ""}`;
  const first = await callModel(
    [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    0.3,
  );
  if (!first.ok) {
    return { ok: false, text: "", model: "north-mini", error: `North Mini analysis failed: ${first.error}` };
  }

  const checked = extractNumbers(first.text).length;
  let bad = unverifiedFigures(first.text, context);

  // One corrective pass: show the model exactly which figures are not in the
  // data and ask for a rewrite that uses only supplied numbers.
  let text = first.text;
  if (bad.length) {
    const fix = await callModel(
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
        { role: "assistant", content: text },
        {
          role: "user",
          content:
            `Verification failed — these figures in your draft do not appear in the Data section (even allowing for unit formatting and rounding): ${bad.join(", ")}.\n` +
            `Rewrite the full analysis using ONLY figures present in the Data section. Remove or replace every figure you cannot source. Keep the same structure and verdict style.`,
        },
      ],
      0.1,
    );
    if (fix.ok) {
      const retryBad = unverifiedFigures(fix.text, context);
      // Accept the rewrite only if it actually improved grounding.
      if (retryBad.length < bad.length) {
        text = fix.text;
        bad = retryBad;
      }
    }
  }

  return {
    ok: true,
    text,
    model: first.model,
    credits: first.credits,
    figuresChecked: checked,
    unverified: bad,
  };
}

/** Run an analysis with North Mini. `context` is a JSON string of computed stats. */
export const analyze = action({
  args: {
    task: v.string(),
    context: v.string(),
    question: v.optional(v.string()),
  },
  handler: async (_ctx, { task, context, question }): Promise<AiResult> =>
    runAnalysis(task, context.slice(0, 60_000), question),
});

/** Lightweight connectivity probe: verifies the key and the North Mini slug. */
export const ping = action({
  args: {},
  handler: async (): Promise<AiResult> =>
    runAnalysis("connectivity check", JSON.stringify({ note: "Reply with a single word: ready" })),
});
