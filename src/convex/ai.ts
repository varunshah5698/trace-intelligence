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

You are given structured data computed by the platform (transaction counts, alert severities, entity risk, FX series, etc.). Rules:
- Base every statement strictly on the supplied data. Never invent figures, ids, or events.
- Numbers you cite must be copied exactly from the data.
- If data is missing or thin, say what is missing and what it would take to conclude.
- Be candid about uncertainty; an empty alert list is not proof of legitimacy.
- Audience: fraud analysts and compliance officers — direct, professional, no filler.

Format: plain-text markdown. Start with a one-line verdict. Then short sections headed "##" with tight bullets. Keep it under ~350 words unless the task asks for detail.`;

type AiResult = { ok: boolean; text: string; model: string; credits?: number; error?: string };

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
  let lastError = "";

  for (const model of NORTH_MODELS) {
    const res = await vly.ai.completion({
      model,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
      temperature: 0.3,
      maxTokens: 900,
    });

    const text = res.data?.choices?.[0]?.message?.content?.trim() ?? "";
    if (res.success && text) {
      return { ok: true, text, model, credits: res.usage?.credits };
    }

    if (!res.success && res.error) lastError = res.error;
    else if (!text) lastError = "model returned an empty response";

    // Retry the next slug only when the failure looks model-specific
    // (unknown/unsupported model). Auth, quota and network errors stop here.
    const modelSpecific = /model|endpoint|not[_ ]found|unsupported|does not exist|404|400/i.test(lastError);
    if (!modelSpecific) break;
  }

  return {
    ok: false,
    text: "",
    model: "north-mini",
    error: `North Mini analysis failed: ${lastError || "unknown gateway error"}`,
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
