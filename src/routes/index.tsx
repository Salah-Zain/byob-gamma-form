import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PerpexLogo } from "@/components/PerpexLogo";
import { ArrowRight, CheckCircle2, Target, Zap } from "lucide-react";
import { useState, useRef } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PerpeX BYOB — Pre-Batch Alignment (Gamma Batch)" },
      {
        name: "description",
        content:
          "Apply for the PerpeX BYOB Gamma Batch — an execution-focused program to build your business.",
      },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const [logoClicks, setLogoClicks] = useState(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => setLogoClicks(0), 800);
    if (next >= 3) {
      setLogoClicks(0);
      navigate({ to: "/admin/login" });
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col items-center justify-center px-6 relative">
      {/* Animated Background Orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      <main className="mx-auto flex max-w-4xl flex-col items-center text-center relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-10 transition-transform hover:scale-105 active:scale-95">
          <PerpexLogo onClick={handleLogoClick} />
        </div>

        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-glow animate-pulse" />
          Gamma Batch · Pre-Batch Alignment
        </div>

        <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-foreground md:text-7xl">
          Welcome to <span className="text-primary">PerpeX</span>
          <br />
          <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            BYOB Program
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-lg font-medium text-foreground/70 leading-relaxed">
          The execution-focused program designed to help you ship real results.
          Align your goals, identify bottlenecks, and commit to the batch.
        </p>

        <div className="mt-12 flex flex-col items-center gap-4">
          <Button asChild variant="hero" size="xl" className="h-14 px-10 text-lg shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)] transition-all">
            <Link to="/apply">
              Apply for Gamma Batch
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            <span>Takes ~5 minutes</span>
            <span className="h-1 w-1 rounded-full bg-muted" />
            <span>12 Questions</span>
          </div>
        </div>

      </main>
    </div>
  );
}
