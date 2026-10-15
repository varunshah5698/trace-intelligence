import { motion } from "framer-motion";
import { ArrowRight, BellRing, FileUp, FlaskConical, Landmark, Network, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { Logo } from "@/components/app/Logo";

const EASE = [0.22, 1, 0.36, 1] as const;

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_104036_bd6924f6-3c8e-417e-8465-6d03c8c2e9e6.mp4";

function Rise({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const CAPS = [
  { icon: FileUp, t: "Any CSV, understood", d: "Unfamiliar columns, messy dates, mixed currencies — mapped with confidence scores, never silent guesses." },
  { icon: ShieldAlert, t: "Explainable detection", d: "Splitting, velocity, pass-through, cycles, plus a freshly trained isolation-forest model. Every alert cites transaction IDs." },
  { icon: Network, t: "Relationship graphs", d: "Cytoscape-powered tracing across accounts, hubs, and circular routes — no invented identities." },
  { icon: Landmark, t: "Corridor analysis", d: "Domestic versus cross-border flows, intermediary chains, and counterparty context — a country alone never decides an alert." },
  { icon: FlaskConical, t: "Labelled demo data", d: "Seeded ledgers with planted scenarios and isolated ground truth for safe evaluation." },
  { icon: BellRing, t: "Review workflow", d: "Cases, notes, audit trail, and notifications that say plainly what is — and isn't — model-confirmed." },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background font-sans text-foreground antialiased">
      {/* full-page video background, tinted to match the Aegis color scheme */}
      <video
        className="pointer-events-none fixed inset-0 h-full w-full object-cover brightness-[.38]"
        src={HERO_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
      />
      <div className="pointer-events-none fixed inset-0 bg-[#0a0f18]/88" aria-hidden />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[#0a0f18]/60 via-transparent to-[#0a0f18]/85" aria-hidden />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[color:var(--primary)]/12 via-transparent to-[color:var(--teal)]/10" aria-hidden />
      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <motion.div className="absolute -top-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-[color:var(--primary)]/15 blur-[130px]"
          animate={{ x: [0, 60, 0], y: [0, 30, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute right-[8%] top-1/3 h-[22rem] w-[22rem] rounded-full bg-[color:var(--teal)]/10 blur-[120px]"
          animate={{ x: [0, -50, 0], y: [0, 40, 0] }} transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }} />
      </div>

      <header className="relative border-b border-border/70 bg-background/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Logo size={46} />
            <div className="leading-tight">
              <p className="text-[20px] font-extrabold tracking-tight">Aegis</p>
              <p className="mono text-[11px] tracking-wide text-muted-foreground">connect the evidence</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link to="/auth" className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Sign in</Link>
            <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/dashboard" className="rounded-md bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white">Open workspace</Link>
            </motion.span>
          </nav>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-5">
        {/* hero with video background */}
        <section className="relative" aria-label="Aegis introduction">
          <div className="relative mx-auto max-w-3xl px-5 py-24 text-center md:py-36">
            <motion.h1
              initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
              className="text-4xl font-extrabold leading-[1.06] tracking-tight md:text-[3.4rem]"
            >
              Every transaction tells a story.{" "}
              <span className="bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--teal)] bg-clip-text text-transparent">
                Connect the evidence.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.16, ease: EASE }}
              className="mx-auto mt-5 max-w-xl text-[15px] leading-7 text-muted-foreground"
            >
              Aegis analyses Indian domestic transfers and international payments,
              turning any messy CSV into explainable, review-ready alerts — with honesty about
              what the machine confirms and what it does not.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.24, ease: EASE }}
              className="mt-7 flex flex-wrap justify-center gap-3"
            >
              <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[color:var(--primary)]/25">
                  Start investigating <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.span>
              <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link to="/datasets" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-medium hover:bg-muted">
                  Upload your CSV
                </Link>
              </motion.span>
            </motion.div>
          </div>
        </section>

        {/* capabilities */}
        <section className="py-14">
          <Rise><h2 className="text-xl font-bold tracking-tight">One workspace, six crafts</h2></Rise>
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {CAPS.map((c, i) => (
              <Rise key={c.t} delay={(i % 3) * 0.08}>
                <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="h-full rounded-xl border border-border bg-card/70 p-5 backdrop-blur-md">
                  <c.icon className="h-5 w-5 text-[color:var(--primary)]" strokeWidth={1.75} />
                  <p className="mt-3 text-sm font-semibold">{c.t}</p>
                  <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">{c.d}</p>
                </motion.div>
              </Rise>
            ))}
          </div>
        </section>

        {/* honesty band */}
        <Rise>
          <section className="mb-14 rounded-xl border border-[color:var(--primary)]/30 bg-[color:var(--primary)]/10 p-6 backdrop-blur-md md:p-8">
            <h2 className="text-lg font-bold tracking-tight">Honest by design</h2>
            <div className="mt-3 grid gap-4 text-[13px] leading-6 text-muted-foreground md:grid-cols-3">
              <p><span className="font-semibold text-foreground">Scores are priorities,</span> not probabilities of crime. Country, channel, or amount alone never decide an alert.</p>
              <p><span className="font-semibold text-foreground">ML ranks unusualness.</span> A freshly trained isolation forest flags outliers — it does not confirm wrongdoing.</p>
              <p><span className="font-semibold text-foreground">Missing data is labelled.</span> Gaps, weak baselines, and currency-aware totals are shown — never hidden or silently filled.</p>
            </div>
            <Link to="/dashboard" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[color:var(--primary)] px-5 py-2.5 text-sm font-semibold text-white">
              Enter the workspace <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </Rise>
      </main>

      <footer className="relative border-t border-border/70">
        <div className="mono mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-[11px] text-muted-foreground">
          <span>Aegis · every transaction tells a story</span>
          <Link to="/dashboard" className="hover:text-foreground">back to workspace ↑</Link>
        </div>
      </footer>
    </div>
  );
}
