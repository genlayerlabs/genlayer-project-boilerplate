import Link from "next/link";
import { Button } from "@/components/ui/button";

const starterFiles = [
  "contracts/football_bets.py",
  "deploy/deployScript.ts",
  "frontend/lib/contracts/FootballBets.ts",
  "frontend/lib/hooks/useFootballBets.ts",
  "frontend/.env",
];

const quickChecks = [
  "npm run typecheck",
  "npm run test:direct",
  "npm run build",
];

export default function SetupPage() {
  return (
    <main className="min-h-screen px-4 py-12 md:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="brand-card p-8 space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-accent">
            GenLayer Starter Setup
          </p>
          <h1 className="text-4xl font-bold">From clone to working boilerplate</h1>
          <p className="max-w-3xl text-muted-foreground">
            This boilerplate now ships with a fast direct-test loop, a
            production-safe frontend build, and a cleaner contract path for
            validator-aware GenLayer development.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="gradient">
              <Link href="/">Back to app</Link>
            </Button>
            <Button asChild variant="outline">
              <a
                href="https://docs.genlayer.com/"
                rel="noreferrer"
                target="_blank"
              >
                Open GenLayer docs
              </a>
            </Button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="brand-card p-6 space-y-4">
            <h2 className="text-2xl font-bold">Quickstart</h2>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li>1. Install root dependencies with <code>npm install</code>.</li>
              <li>2. Copy <code>frontend/.env.example</code> to <code>frontend/.env</code>.</li>
              <li>3. Set <code>NEXT_PUBLIC_GENLAYER_RPC_URL</code> and <code>NEXT_PUBLIC_CONTRACT_ADDRESS</code>.</li>
              <li>4. Deploy with <code>npm run deploy</code>.</li>
              <li>5. Start the frontend with <code>npm run dev</code>.</li>
            </ol>
          </div>

          <div className="brand-card p-6 space-y-4">
            <h2 className="text-2xl font-bold">Validation loop</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {quickChecks.map((command) => (
                <li key={command}>
                  <code>{command}</code>
                </li>
              ))}
              <li>
                Use <code>gltest test/test_footbal_bet.py -q -m integration</code> only when GenLayer
                Studio or localnet is running.
              </li>
            </ul>
          </div>
        </section>

        <section className="brand-card p-6 space-y-4">
          <h2 className="text-2xl font-bold">Edit these first</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {starterFiles.map((file) => (
              <li
                key={file}
                className="rounded-lg border border-white/10 bg-black/10 px-4 py-3 font-mono text-sm text-muted-foreground"
              >
                {file}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
