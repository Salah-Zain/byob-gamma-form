import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logo from "@/assets/perpex-logo.png";
import { PerpexLogo } from "@/components/PerpexLogo";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/success")({
  head: () => ({
    meta: [
      { title: "Application Submitted — PerpeX BYOB" },
      { name: "description", content: "Your PerpeX BYOB application has been submitted successfully." },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      <div className="w-full max-w-xl rounded-3xl border border-border/50 bg-card/50 backdrop-blur-md p-10 text-center shadow-[var(--shadow-elegant)] relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-blue-50 ring-2 ring-blue-100 shadow-inner">
          <PerpexLogo className="scale-125" />
        </div>

        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
          <CheckCircle2 className="h-4 w-4" /> Submitted
        </div>

        <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
          You're in the pipeline 🚀
        </h1>

        <p className="mt-4 text-base text-foreground/80">
          Thank you for completing the <span className="font-semibold text-primary">PerpeX BYOB Gamma Batch</span> pre-batch alignment form.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Our team will review your application and reach out shortly with next steps. Until then —
          stay sharp, keep building, and get ready to execute.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild variant="hero" size="lg">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>

        <p className="mt-8 text-xs uppercase tracking-widest text-muted-foreground">
          PerpeX · Build · Execute · Win
        </p>
      </div>
    </div>
  );
}
