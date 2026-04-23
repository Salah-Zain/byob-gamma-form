import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PerpexLogo } from "@/components/PerpexLogo";
import { adminLogin } from "@/lib/storage";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Lock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Login — PerpeX" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ok = await adminLogin(u, p);
      if (ok) {
        navigate({ to: "/admin/dashboard" });
      } else {
        toast.error("Invalid credentials or not an admin");
      }
    } catch {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--gradient-soft)] px-6 relative overflow-hidden">
      <Toaster richColors position="top-center" />
      {/* Animated Background Orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      <div className="w-full max-w-md rounded-3xl border border-border/50 bg-card/50 backdrop-blur-md p-8 shadow-[var(--shadow-elegant)] relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="mb-6 flex justify-center">
          <PerpexLogo />
        </div>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-foreground">Admin Access</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to view submissions</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Username</Label>
            <Input value={u} onChange={(e) => setU(e.target.value)} autoFocus placeholder="admin" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Password</Label>
            <Input type="password" value={p} onChange={(e) => setP(e.target.value)} />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
