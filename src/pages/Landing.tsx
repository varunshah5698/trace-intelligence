import { motion } from "framer-motion";
import {
  ArrowRight, BadgeCheck, Banknote, BookOpenCheck, Boxes, Building2,
  CheckCircle2, ChevronRight, CircleCheck, Database, FileUp, Fingerprint,
  FlaskConical, Gauge, Landmark, Lock, Network, Radar, ScanSearch,
  ShieldAlert, ShieldCheck, Sparkles, Waypoints, Workflow,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { Logo } from "@/components/app/Logo";

const EASE = [0.22, 1, 0.36, 1] as const;

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_104036_bd6924f6-3c8e-417e-8465-6d03c8c2e9e6.mp4";

function Rise({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a78bfa]">{children}</p>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="max-w-2xl">
      <Rise>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="display mt-2.5 text-2xl font-bold leading-tight tracking-tight md:text-[1.9rem]">{title}</h2>
        {sub && <p className="mt-3 text-[14px] leading-7 text-muted-foreground">{sub}</p>}
      </Rise>
    </div>
  );
}

const NAV = [
  { to: "#platform", label: "Platform" },
  { to: "#detection", label: "Detection" },
  { to: "#workflow", label: "How it works" },
  { to: "#teams", label: "Who it's for" },
  { to: "#trust", label: "Trust" },
  { to: "#faq", label: "FAQ" },
];

const STATS = [
  { v: "9", l: "detection rules", d: "7 deterministic + isolation forest + evaluation harness" },
  { v: "100%", l: "alerts with evidence", d: "every alert cites the exact transaction IDs behind it" },
  { v: "0", l: "rows leave the browser", d: "parsing, scoring and graphs run client-side" },
  { v: "4", l: "investigation stages", d: "ingest → detect → case → report, one workspace" },
];

const PAINS = [
  {
    icon: FileUp,
    t: "Messy exports, no schema",
    d: "Core banking exports arrive with different column names, date formats and currencies. Analysts end up re-cleaning in spreadsheets before any analysis starts.",
  },
  {
    icon: ShieldAlert,
    t: "Alerts nobody can explain",
    d: "Black-box scores without transaction-level evidence force reviewers to rebuild the reasoning by hand — or sign off on conclusions they cannot defend to an auditor.",
  },
  {
    icon: Workflow,
    t: "Findings lost between tools",
    d: "Detection in one system, graphs in another, notes in email, the SAR narrative in a doc. Without an append-only trail, decisions cannot be reconstructed later.",
  },
];

const PLATFORM = [
  { icon: FileUp, t: "Any CSV, understood", d: "Column inference with confidence scores maps unfamiliar exports onto sender, receiver, amount, currency and timestamp — never silent guesses. A quality report flags gaps before analysis." },
  { icon: Radar, t: "Explainable detection", d: "Structuring, velocity, pass-through, fan-in/out, cycles, dormant reactivation, behaviour drift, cross-border outliers and a freshly trained isolation forest — each alert lists the transactions and values that triggered it." },
  { icon: Network, t: "Relationship intelligence", d: "Interactive entity graphs and directed fund-flow maps surface hubs, mule chains and circular routes across accounts — with no invented identities." },
  { icon: Landmark, t: "Corridor analysis", d: "Domestic versus cross-border views with intermediary chains and counterparty context. Country, channel or amount alone never decides an alert." },
  { icon: Gauge, t: "Prioritised review queue", d: "Review-priority scores, severity meters and evidence density rank the queue so analysts work the highest-value alerts first — scores are priorities, not probabilities of crime." },
  { icon: BookOpenCheck, t: "Cases, audit & reports", d: "Escalate alerts into cases with status, notes and linked evidence; every action writes an append-only audit event; exportable reports are generated from actual backend data." },
];

const RULES = [
  { id: "split", cat: "Structuring", name: "Possible transaction splitting", d: "Repeated similar-value transfers by one sender inside a short window." },
  { id: "velocity", cat: "Velocity", name: "Velocity burst", d: "Abrupt increase in count or value versus the account's own history." },
  { id: "passthrough", cat: "Pass-through", name: "Potential rapid pass-through", d: "Funds received then quickly forwarded — layered rather than held." },
  { id: "fan", cat: "Network", name: "Fan-in / fan-out", d: "Many senders fund one account, or one account funds many." },
  { id: "cycle", cat: "Network", name: "Circular movement", d: "Directed cycles A→B→C→A that return funds to their origin." },
  { id: "dormant", cat: "Behaviour", name: "Dormant reactivation", d: "Sudden activity after prolonged inactivity on a quiet account." },
  { id: "behaviour", cat: "Behaviour", name: "Unusual customer behaviour", d: "Amount and frequency deviation from the customer's own baseline." },
  { id: "xborder", cat: "Cross-border", name: "Unusual cross-border movement", d: "New corridor, new counterparty, or amount outlier on international legs." },
  { id: "ml", cat: "Anomaly", name: "ML isolation anomaly", d: "Isolation forest trained fresh on the dataset ranks the most unusual transfers." },
];

const STEPS = [
  { n: "01", t: "Ingest", d: "Upload any transaction CSV — or open a seeded demo ledger with planted scenarios. Parsing, type inference and field mapping all happen in your browser." },
  { n: "02", t: "Profile & normalise", d: "A data-quality report scores completeness and coverage, flags missing fields, and normalises dates, amounts and currencies before a single rule runs." },
  { n: "03", t: "Detect & score", d: "Nine rules scan in one pass, each reporting what it found. Alerts carry evidence, severity and a review-priority score; the isolation forest is trained fresh per dataset." },
  { n: "04", t: "Investigate & report", d: "Open the workbench: linked transactions, entity graph, fund flows, notes and status. Escalate to a case, leave an audit trail, export the report." },
];

const TEAMS = [
  {
    icon: Landmark,
    t: "Banks & NBFCs",
    d: "Run domestic and cross-border monitoring over core-banking exports, and hand regulators evidence-backed alerts instead of unexplained scores.",
    pts: ["Rule coverage for structuring & layering", "Currency-aware totals (INR lakh/crore native)", "Audit trail for internal and regulatory review"],
  },
  {
    icon: Banknote,
    t: "Fintech & payments",
    d: "Move from raw transfer logs to a prioritised alert queue without standing up an ML platform — the model trains in the browser, per dataset.",
    pts: ["Any CSV schema, mapped with confidence scores", "Pass-through and velocity rules for money movement", "Network views for mule and hub detection"],
  },
  {
    icon: Building2,
    t: "Audit & consulting",
    d: "Assess a client's transaction book independently: import, analyse, document findings, and export a report that shows every step taken.",
    pts: ["Labelled demo data with ground truth for testing", "Evaluation harness (precision / recall / F1)", "Append-only notes and case history per engagement"],
  },
];

const TRUST = [
  { icon: Fingerprint, t: "Your data stays yours", d: "CSV parsing, cleaning, detection and graphs run entirely in the browser. Transaction rows are never uploaded — only case metadata and audit events sync to your workspace." },
  { icon: BadgeCheck, t: "Scores are priorities, not verdicts", d: "A review-priority of 82 means 'look here first' — not an 82% chance of crime. The UI never presents a model output as a finding." },
  { icon: ScanSearch, t: "Missing data is labelled", d: "Gaps, weak baselines and currency-aware totals are shown explicitly. Nothing is silently filled, and a country alone never triggers an alert." },
  { icon: Lock, t: "Append-only accountability", d: "Every status change, note and escalation writes an immutable audit event with actor, action, record and timestamp — reconstructable months later." },
];

const FAQ = [
  {
    q: "Does my transaction data leave the browser?",
    a: "No. Parsing, field mapping, quality profiling, all nine detection rules, the isolation forest and every graph run client-side. Only investigation artefacts you deliberately create — cases, notes, status changes and audit events — sync to your workspace so they survive across devices.",
  },
  {
    q: "Is the machine learning model telling me who is guilty?",
    a: "No. The isolation forest is retrained on each dataset you open and ranks how unusual a transfer is relative to its peers. It never confirms wrongdoing — it orders your review queue. Deterministic rules and model output are labelled separately everywhere they appear.",
  },
  {
    q: "What file formats and schemas are supported?",
    a: "Any CSV. Aegis infers column semantics with confidence scores and lets you correct any mapping before analysis. Mixed date formats, multiple currencies and inconsistent naming are handled during normalisation, and the quality report tells you exactly what was missing.",
  },
  {
    q: "Can I evaluate whether the detection is any good?",
    a: "Yes. Seeded demo ledgers ship with planted scenarios and isolated ground truth, and an evaluation harness reports precision, recall, F1 and per-scenario recall — so you can verify coverage before trusting the queue on real data.",
  },
  {
    q: "How do findings reach an auditor or regulator?",
    a: "Every alert links to its exact transactions, evidence and rule parameters. Escalations become cases with notes, status history and an append-only audit trail, and reports are generated from the same backend records — nothing is re-typed for export.",
  },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#070611] font-sans text-foreground antialiased">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-[#070611]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="transition-transform duration-300 group-hover:scale-105"><Logo size={34} /></span>
            <div className="leading-tight">
              <p className="display text-[17px] font-bold tracking-tight">Aegis</p>
              <p className="mono text-[9px] tracking-wide text-muted-foreground">financial intelligence</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <a key={n.to} href={n.to} className="rounded-full px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-[color:var(--glass-hi)] hover:text-foreground">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="rounded-full px-3.5 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-[color:var(--glass-hi)] hover:text-foreground">
              Sign in
            </Link>
            <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/dashboard" className="inline-block rounded-full border border-[color:var(--primary)]/50 bg-[#141026]/85 px-4 py-2 text-[13px] font-semibold text-[#c4b5fd] backdrop-blur-md transition-all hover:border-[color:var(--primary)] hover:bg-[#1a1333] hover:text-white hover:shadow-[0_0_26px_-6px_rgba(167,139,250,0.75)]">
                Open workspace
              </Link>
            </motion.span>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" aria-label="Aegis introduction">
        <video
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          src={HERO_VIDEO}
          autoPlay muted loop playsInline preload="metadata" aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-black/45" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#070611]/80 via-[#070611]/60 to-[#070611]" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_0%,rgba(7,6,17,0.8)_100%)]" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-3xl py-24 text-center md:py-32">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--primary)]/40 bg-[#141026]/80 px-3.5 py-1.5 text-[11px] font-medium text-[#c4b5fd] backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" /> Transaction monitoring &amp; AML investigation workspace
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
              className="display mt-5 text-4xl font-bold leading-[1.06] tracking-tight md:text-[3.3rem]"
            >
              Turn raw transaction exports into{" "}
              <span className="bg-gradient-to-r from-[#c4b5fd] via-[#a78bfa] to-[#f472b6] bg-clip-text text-transparent">
                evidence-backed alerts
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.16, ease: EASE }}
              className="mx-auto mt-5 max-w-xl text-[15px] leading-7 text-muted-foreground"
            >
              Aegis ingests any CSV, profiles its quality, runs nine explainable detection rules plus a
              freshly trained anomaly model, and carries every alert through case, audit trail and report —
              with plain honesty about what the machine confirms and what it does not.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.24, ease: EASE }}
              className="mt-7 flex flex-wrap justify-center gap-3"
            >
              <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link to="/dashboard" className="edge inline-flex items-center gap-2 rounded-full border border-[color:var(--primary)]/55 bg-[#141026]/85 px-6 py-3 text-sm font-semibold text-[#c4b5fd] backdrop-blur-md transition-colors hover:bg-[#1a1333] hover:text-white">
                  Open the live workspace <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.span>
              <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link to="/datasets" className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-[color:var(--glass-border-hi)]">
                  Upload your CSV
                </Link>
              </motion.span>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.34 }}
              className="mono mt-6 text-[11px] tracking-wide text-muted-foreground"
            >
              no data upload · no credit card · demo ledgers included
            </motion.p>
          </div>

          {/* stat band */}
          <div className="grid gap-3 border-y border-border/50 py-7 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <Rise key={s.l} delay={i * 0.07}>
                <div className="px-1">
                  <p className="display tnum text-3xl font-bold tracking-tight text-foreground">{s.v}</p>
                  <p className="mt-0.5 text-[13px] font-semibold text-[#c4b5fd]">{s.l}</p>
                  <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{s.d}</p>
                </div>
              </Rise>
            ))}
          </div>
        </div>
      </section>

      <main className="relative mx-auto max-w-6xl px-5">
        {/* ── Problem ─────────────────────────────────────────── */}
        <section className="pt-16" aria-label="The problem">
          <SectionHead
            eyebrow="The problem"
            title="Investigation stalls before the analysis begins"
            sub="Most teams don't lack data — they lack a defensible path from a raw export to a documented decision."
          />
          <div className="mt-7 grid gap-3 md:grid-cols-3">
            {PAINS.map((p, i) => (
              <Rise key={p.t} delay={i * 0.08}>
                <div className="glass h-full rounded-2xl p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--destructive)]/30 bg-[color:var(--destructive)]/10">
                    <p.icon className="h-4 w-4 text-[#fb7185]" strokeWidth={1.75} />
                  </div>
                  <p className="display mt-3.5 text-sm font-semibold">{p.t}</p>
                  <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">{p.d}</p>
                </div>
              </Rise>
            ))}
          </div>
        </section>

        {/* ── Platform ────────────────────────────────────────── */}
        <section id="platform" className="scroll-mt-20 pt-16" aria-label="Platform capabilities">
          <SectionHead
            eyebrow="The platform"
            title="One workspace, from raw file to filed report"
            sub="Six capability areas that replace the spreadsheet-and-slack workflow most investigation teams run on."
          />
          <div className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {PLATFORM.map((c, i) => (
              <Rise key={c.t} delay={(i % 3) * 0.08}>
                <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} className="glass sheen h-full rounded-2xl p-5">
                  <div className="grad-bg flex h-9 w-9 items-center justify-center rounded-xl p-px shadow-[0_8px_24px_-10px_rgba(139,92,246,0.8)]">
                    <span className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0b0a1a]/80">
                      <c.icon className="h-4 w-4 text-[#c4b5fd]" strokeWidth={1.75} />
                    </span>
                  </div>
                  <p className="display mt-3.5 text-sm font-semibold">{c.t}</p>
                  <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">{c.d}</p>
                </motion.div>
              </Rise>
            ))}
          </div>
        </section>

        {/* ── Detection coverage ──────────────────────────────── */}
        <section id="detection" className="scroll-mt-20 pt-16" aria-label="Detection coverage">
          <SectionHead
            eyebrow="Detection coverage"
            title="Nine rules, every one explainable"
            sub="Deterministic rules you can read and tune, plus an isolation forest trained fresh on each dataset — each reporting exactly what it scanned and why it fired."
          />
          <div className="mt-7 overflow-hidden rounded-2xl border border-border/60">
            {RULES.map((r, i) => (
              <Rise key={r.id} delay={Math.min(i * 0.04, 0.3)}>
                <div className={`group flex flex-col gap-1.5 px-5 py-3.5 transition-colors hover:bg-[color:var(--glass-hi)] sm:flex-row sm:items-center sm:gap-4 ${i % 2 ? "bg-[color:var(--glass)]" : "bg-transparent"}`}>
                  <span className="mono w-24 shrink-0 rounded-md border border-[color:var(--primary)]/30 bg-[color:var(--primary)]/10 px-2 py-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-[#c4b5fd]">
                    {r.cat}
                  </span>
                  <span className="display w-64 shrink-0 text-[13px] font-semibold">{r.name}</span>
                  <span className="text-[13px] leading-6 text-muted-foreground">{r.d}</span>
                  <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-1 sm:block" />
                </div>
              </Rise>
            ))}
          </div>
          <Rise delay={0.1}>
            <div className="glass mt-4 flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--teal)]" />
                <div>
                  <p className="display text-sm font-semibold">Prove it before you trust it</p>
                  <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
                    Seeded demo ledgers carry planted scenarios with isolated ground truth; the evaluation harness reports precision, recall, F1 and per-scenario recall on every run.
                  </p>
                </div>
              </div>
              <Link to="/reports" className="edge inline-flex shrink-0 items-center gap-2 rounded-full border border-[color:var(--primary)]/55 bg-[#141026]/85 px-5 py-2.5 text-[13px] font-semibold text-[#c4b5fd] backdrop-blur-md transition-colors hover:bg-[#1a1333] hover:text-white">
                See evaluation reports <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Rise>
        </section>

        {/* ── Workflow ────────────────────────────────────────── */}
        <section id="workflow" className="scroll-mt-20 pt-16" aria-label="How it works">
          <SectionHead
            eyebrow="How it works"
            title="Four steps, one continuous evidence chain"
            sub="Nothing is re-keyed between stages — the transaction IDs that trigger an alert are the same ones attached to the case and the report."
          />
          <div className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Rise key={s.n} delay={i * 0.08}>
                <div className="glass lift h-full rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <span className="display text-2xl font-bold text-[color:var(--primary)]/70">{s.n}</span>
                    <span className="h-px flex-1 mx-3 bg-gradient-to-r from-[color:var(--primary)]/40 to-transparent" />
                  </div>
                  <p className="display mt-3 text-sm font-semibold">{s.t}</p>
                  <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">{s.d}</p>
                </div>
              </Rise>
            ))}
          </div>
        </section>

        {/* ── Teams ───────────────────────────────────────────── */}
        <section id="teams" className="scroll-mt-20 pt-16" aria-label="Who it's for">
          <SectionHead
            eyebrow="Who it's for"
            title="Built for the people who sign off on the file"
            sub="Whether the audience is a regulator, an audit committee or your own risk lead, the output has to hold up."
          />
          <div className="mt-7 grid gap-3 md:grid-cols-3">
            {TEAMS.map((t, i) => (
              <Rise key={t.t} delay={i * 0.08}>
                <div className="glass sheen flex h-full flex-col rounded-2xl p-5">
                  <div className="flex items-center gap-3">
                    <div className="grad-bg flex h-9 w-9 items-center justify-center rounded-xl p-px">
                      <span className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0b0a1a]/80">
                        <t.icon className="h-4 w-4 text-[#c4b5fd]" strokeWidth={1.75} />
                      </span>
                    </div>
                    <p className="display text-sm font-semibold">{t.t}</p>
                  </div>
                  <p className="mt-3 text-[13px] leading-6 text-muted-foreground">{t.d}</p>
                  <ul className="mt-3.5 space-y-2 border-t border-border/50 pt-3.5">
                    {t.pts.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-[12.5px] leading-5 text-foreground/85">
                        <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--success)]" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </Rise>
            ))}
          </div>
        </section>

        {/* ── Trust band ──────────────────────────────────────── */}
        <section id="trust" className="scroll-mt-20 pt-16" aria-label="Trust and honesty">
          <Rise>
            <div className="glass rounded-3xl border border-[color:var(--primary)]/25 bg-gradient-to-br from-[color:var(--primary)]/12 via-transparent to-[#ec4899]/8 p-7 md:p-9">
              <Eyebrow>Honest by design</Eyebrow>
              <h2 className="display mt-2.5 text-2xl font-bold tracking-tight md:text-[1.9rem]">
                The system tells you what it knows — and what it doesn't
              </h2>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {TRUST.map((t) => (
                  <div key={t.t} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[color:var(--primary)]/35 bg-[#141026]/70">
                      <t.icon className="h-4 w-4 text-[#c4b5fd]" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="display text-[13.5px] font-semibold">{t.t}</p>
                      <p className="mt-1 text-[13px] leading-6 text-muted-foreground">{t.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Rise>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────── */}
        <section id="faq" className="scroll-mt-20 pt-16" aria-label="Frequently asked questions">
          <SectionHead eyebrow="FAQ" title="Straight answers" />
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {FAQ.map((f, i) => (
              <Rise key={f.q} delay={(i % 2) * 0.07}>
                <div className="glass h-full rounded-2xl p-5">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--teal)]" />
                    <p className="display text-[13.5px] font-semibold leading-6">{f.q}</p>
                  </div>
                  <p className="mt-2 pl-6 text-[13px] leading-6 text-muted-foreground">{f.a}</p>
                </div>
              </Rise>
            ))}
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────── */}
        <section className="py-16" aria-label="Get started">
          <Rise>
            <div className="relative overflow-hidden rounded-3xl border border-[color:var(--primary)]/35 bg-[#0d0b1e]/90 px-7 py-12 text-center">
              <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#7c5cff]/25 blur-[110px]" aria-hidden />
              <div className="relative">
                <p className="mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a78bfa]">Get started</p>
                <h2 className="display mx-auto mt-3 max-w-xl text-2xl font-bold leading-tight tracking-tight md:text-[2rem]">
                  Open the workspace and run your first file tonight
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-[14px] leading-7 text-muted-foreground">
                  Start with a seeded demo ledger to see the full path — ingest, detect, investigate, report —
                  then swap in your own CSV. Nothing to install.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                    <Link to="/dashboard" className="edge inline-flex items-center gap-2 rounded-full border border-[color:var(--primary)]/55 bg-[#141026]/85 px-6 py-3 text-sm font-semibold text-[#c4b5fd] backdrop-blur-md transition-colors hover:bg-[#1a1333] hover:text-white">
                      Open the live workspace <ArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.span>
                  <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                    <Link to="/auth" className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-[color:var(--glass-border-hi)]">
                      Create an account
                    </Link>
                  </motion.span>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-muted-foreground">
                  {[
                    { i: Database, t: "Rows stay in your browser" },
                    { i: ShieldCheck, t: "Append-only audit trail" },
                    { i: Boxes, t: "Demo ledgers included" },
                    { i: Waypoints, t: "Domestic + cross-border" },
                  ].map((m) => (
                    <span key={m.t} className="inline-flex items-center gap-1.5">
                      <m.i className="h-3.5 w-3.5 text-[color:var(--teal)]" /> {m.t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Rise>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="relative border-t border-border/70">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Logo size={30} />
              <p className="display text-[15px] font-bold tracking-tight">Aegis</p>
            </div>
            <p className="mt-3 text-[12.5px] leading-6 text-muted-foreground">
              Transaction monitoring and AML investigation workspace. Every transaction tells a story —
              connect the evidence.
            </p>
          </div>
          <div>
            <p className="mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Monitor</p>
            <ul className="mt-3 space-y-2 text-[13px] text-muted-foreground">
              <li><Link to="/domestic" className="hover:text-foreground">Domestic India</Link></li>
              <li><Link to="/international" className="hover:text-foreground">International payments</Link></li>
              <li><Link to="/transactions" className="hover:text-foreground">Transaction ledger</Link></li>
              <li><Link to="/detections" className="hover:text-foreground">Detection alerts</Link></li>
            </ul>
          </div>
          <div>
            <p className="mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Investigate</p>
            <ul className="mt-3 space-y-2 text-[13px] text-muted-foreground">
              <li><Link to="/network" className="hover:text-foreground">Entity network</Link></li>
              <li><Link to="/fund-flows" className="hover:text-foreground">Fund flows</Link></li>
              <li><Link to="/investigations" className="hover:text-foreground">Case workbench</Link></li>
              <li><Link to="/audit" className="hover:text-foreground">Audit trail</Link></li>
            </ul>
          </div>
          <div>
            <p className="mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Data</p>
            <ul className="mt-3 space-y-2 text-[13px] text-muted-foreground">
              <li><Link to="/datasets" className="hover:text-foreground">Dataset library</Link></li>
              <li><Link to="/reports" className="hover:text-foreground">Reports &amp; evaluation</Link></li>
              <li><Link to="/entities" className="hover:text-foreground">Entity intelligence</Link></li>
              <li><Link to="/auth" className="hover:text-foreground">Sign in</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/60">
          <div className="mono mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-4 text-[11px] text-muted-foreground">
            <span>© {new Date().getFullYear()} Aegis · financial intelligence</span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3 w-3" /> scores are priorities, not verdicts
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
