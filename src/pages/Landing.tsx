import { Link } from "react-router";
import { ArrowRight, FileSearch, ShieldCheck, Waypoints } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 text-white text-sm font-semibold">T</div>
            <div>
              <p className="text-sm font-semibold tracking-tight">TRACE Intelligence</p>
              <p className="text-[11px] text-neutral-500">Every transaction tells a story. Connect the evidence.</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link to="/auth" className="rounded-md px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100">Sign in</Link>
            <Link to="/auth" className="rounded-md bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-neutral-700">Open workspace</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-16 md:py-24">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">Financial crime monitoring · v1 for compliance teams</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            Analyse uploaded CSVs. Find the patterns that matter.
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-neutral-600">
            TRACE v1 does one thing well: take any transaction CSV — unfamiliar columns,
            messy dates, mixed currencies — map it, profile its quality, run explainable
            detection, and hand reviewers evidence they can defend.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700">
              Start analysing <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-medium hover:bg-neutral-50">
              Try the demo dataset
            </Link>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 md:grid-cols-3">
            {[
              { icon: FileSearch, t: "Arbitrary CSV intake", d: "Delimiter detection, type inference, confidence-scored mapping. Ambiguous fields ask — never silently guess." },
              { icon: ShieldCheck, t: "Explainable detection", d: "Splitting, velocity, pass-through, fan-in/out, cycles, dormancy. Every alert cites transaction IDs." },
              { icon: Waypoints, t: "Network + FX context", d: "Relationship graph, fund-flow tracing, and genuine market/reference FX rates with labelled states." },
            ].map((f) => (
              <div key={f.t} className="bg-white p-6">
                <f.icon className="h-5 w-5" strokeWidth={1.75} />
                <p className="mt-3 text-sm font-semibold">{f.t}</p>
                <p className="mt-1.5 text-[13px] leading-6 text-neutral-600">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-neutral-200 py-12">
          <h2 className="text-lg font-semibold tracking-tight">How a review works</h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-4">
            {[
              ["01", "Upload", "Drop a CSV. Get delimiter, types, missingness, duplicates."],
              ["02", "Map", "Confirm suggested columns. See a readiness score and Tier."],
              ["03", "Run", "Detection executes locally on your data with your rules."],
              ["04", "Review", "Open evidence, trace the graph, export the report."],
            ].map(([n, t, d]) => (
              <li key={n} className="border-t-2 border-neutral-900 pt-3">
                <p className="text-xs text-neutral-400">{n}</p>
                <p className="mt-1 text-sm font-semibold">{t}</p>
                <p className="mt-1 text-[13px] leading-6 text-neutral-600">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-neutral-200 py-12">
          <h2 className="text-lg font-semibold tracking-tight">Honest boundaries</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 p-5 text-[13px] leading-6 text-neutral-600">
              Scores are <span className="font-medium text-neutral-900">alert priorities (0–100)</span>, not probabilities of crime.
              Country, channel, or amount alone never decides an alert. Synthetic data is always labelled synthetic.
            </div>
            <div className="rounded-lg border border-neutral-200 p-5 text-[13px] leading-6 text-neutral-600">
              FX quotes come from real providers with source timestamps. When the network is down you see
              <span className="font-medium text-neutral-900"> cached / unavailable</span> — never invented ticks.
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 text-xs text-neutral-500">
          <span>TRACE Intelligence · Minimalism build</span>
          <span>CSV-first · Domestic + International · FX-aware</span>
        </div>
      </footer>
    </div>
  );
}
