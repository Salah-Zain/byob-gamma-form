import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { PerpexLogo } from "@/components/PerpexLogo";
import { adminLogout, getSubmissions, type Submission } from "@/lib/storage";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, CheckCircle2, Clock, TrendingUp, Search, LogOut, Eye, Download, Loader2, X } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — PerpeX" }] }),
  component: AdminDashboard,
});

const STAGES = ["Just an idea", "Started but inconsistent", "Actively working", "Already getting customers"];
const BOTTLENECKS = ["Clarity", "Taking action", "Sales / getting customers", "Confidence", "Consistency"];

function AdminDashboard() {
  const navigate = useNavigate();
  const { state: guardState } = useAdminGuard();
  const [list, setList] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [bottleneckFilter, setBottleneckFilter] = useState<string>("all");
  const [active, setActive] = useState<Submission | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  useEffect(() => {
    if (guardState !== "authorized") return;
    let mounted = true;
    (async () => {
      try {
        const data = await getSubmissions();
        if (mounted) setList(data);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load submissions");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [guardState]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((s) => {
      if (stageFilter !== "all" && s.stage !== stageFilter) return false;
      if (bottleneckFilter !== "all" && s.bottleneck !== bottleneckFilter) return false;
      if (!q) return true;
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.stage.toLowerCase().includes(q) ||
        s.bottleneck.toLowerCase().includes(q) ||
        s.ideaSentence.toLowerCase().includes(q)
      );
    });
  }, [list, query, stageFilter, bottleneckFilter]);

  const stats = useMemo(() => {
    const total = list.length;
    const committed = list.filter((s) => s.hoursWeekly === "20+ hrs" || s.hoursWeekly === "10–20 hrs").length;
    const withCustomers = list.filter((s) => s.stage === "Already getting customers").length;
    const today = new Date().toDateString();
    const todayCount = list.filter((s) => new Date(s.submittedAt).toDateString() === today).length;
    return { total, committed, withCustomers, todayCount };
  }, [list]);

  const logout = async () => {
    await adminLogout();
    navigate({ to: "/" });
  };

  const exportCSV = async () => {
    if (filtered.length === 0) return;
    setExporting(true);
    setExportProgress(0);
    const toastId = toast.loading(`Preparing CSV (${filtered.length} rows)…`);
    try {
      const headers = [
        "Submitted At", "Full Name", "Phone", "Stage", "Idea (one sentence)",
        "What they're building", "Target Customer", "Problem", "Current Solutions",
        "Why Switch", "Done So Far", "Bottleneck", "Hours Weekly", "Outcome", "Agreed",
      ];
      const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
      const total = filtered.length;
      const CHUNK = 100;
      const rows: string[] = [];
      for (let i = 0; i < total; i += CHUNK) {
        const slice = filtered.slice(i, i + CHUNK);
        for (const s of slice) {
          rows.push([
            new Date(s.submittedAt).toISOString(),
            s.fullName, s.phone, s.stage, s.ideaSentence, s.buildingWhat,
            s.targetCustomer, s.problem, s.currentSolutions, s.whySwitch,
            s.doneSoFar.join("; "), s.bottleneck, s.hoursWeekly, s.outcome,
            s.agreed ? "Yes" : "No",
          ].map((v) => escape(String(v ?? ""))).join(","));
        }
        const pct = Math.min(100, Math.round(((i + slice.length) / total) * 100));
        setExportProgress(pct);
        // Yield to browser so progress UI can update on large sets
        if (total > CHUNK) await new Promise((r) => setTimeout(r, 0));
      }
      const csv = [headers.map(escape).join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = `perpex-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${total} row${total === 1 ? "" : "s"} to ${filename}`, { 
        id: toastId,
        description: "The download has started successfully."
      });
    } catch (e) {
      console.error(e);
      toast.error("CSV export failed. Please try again.", { id: toastId });
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  };

  const clearFilters = () => {
    setQuery("");
    setStageFilter("all");
    setBottleneckFilter("all");
  };

  const filtersActive = query || stageFilter !== "all" || bottleneckFilter !== "all";

  if (guardState === "checking") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--gradient-soft)] relative overflow-hidden">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
        <div className="flex flex-col items-center gap-4 relative z-10 animate-in fade-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <PerpexLogo />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Verifying session...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-soft)] relative overflow-hidden">
      <Toaster richColors position="top-center" />
      {/* Animated Background Orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <PerpexLogo />
            <span className="hidden rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary sm:inline">
              Admin
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">All BYOB Gamma Batch submissions in one place.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button 
              variant="hero" 
              onClick={exportCSV} 
              disabled={filtered.length === 0 || exporting}
              className="min-w-[160px]"
            >
              {exporting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Exporting ({exportProgress}%)</>
              ) : (
                <><Download className="h-4 w-4" /> Export CSV ({filtered.length})</>
              )}
            </Button>
            {exporting && (
              <Progress value={exportProgress} className="h-1 w-full max-w-[160px]" />
            )}
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Total Applications" value={stats.total} />
          <StatCard icon={Clock} label="Submitted Today" value={stats.todayCount} />
          <StatCard icon={CheckCircle2} label="High Commitment (10+ hrs)" value={stats.committed} />
          <StatCard icon={TrendingUp} label="Already Getting Customers" value={stats.withCustomers} />
        </div>

        <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-md shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-3 border-b border-border p-5">
            <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-foreground">Submissions</h2>
                <p className="text-xs text-muted-foreground">{filtered.length} of {list.length} shown</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, phone, idea…"
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={bottleneckFilter} onValueChange={setBottleneckFilter}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Filter by bottleneck" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All bottlenecks</SelectItem>
                  {BOTTLENECKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
              {filtersActive && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4" /> Clear
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="text-foreground">Name</TableHead>
                  <TableHead className="text-foreground">Phone</TableHead>
                  <TableHead className="text-foreground">Stage</TableHead>
                  <TableHead className="text-foreground">Bottleneck</TableHead>
                  <TableHead className="text-foreground">Hours/Week</TableHead>
                  <TableHead className="text-foreground">Submitted</TableHead>
                  <TableHead className="text-right text-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                      {list.length === 0 ? "No applications submitted yet." : "No results match your filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s.id} className="hover:bg-secondary/40">
                      <TableCell className="font-semibold text-foreground">{s.fullName}</TableCell>
                      <TableCell className="text-foreground">{s.phone}</TableCell>
                      <TableCell><Badge>{s.stage}</Badge></TableCell>
                      <TableCell className="text-foreground">{s.bottleneck}</TableCell>
                      <TableCell className="text-foreground">{s.hoursWeekly}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(s.submittedAt).toLocaleDateString()}{" "}
                        <span className="text-xs">{new Date(s.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setActive(s)}>
                          <Eye className="h-4 w-4" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">{active?.fullName}</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-4 text-sm text-foreground">
              <Detail k="Phone" v={active.phone} />
              <Detail k="Stage" v={active.stage} />
              <Detail k="One-sentence idea" v={active.ideaSentence} />
              <Detail k="What they're building" v={active.buildingWhat} />
              <Detail k="Target customer" v={active.targetCustomer} />
              <Detail k="Problem" v={active.problem} />
              <Detail k="Current solutions" v={active.currentSolutions} />
              <Detail k="Why switch" v={active.whySwitch} />
              <Detail k="Done so far" v={active.doneSoFar.join(", ")} />
              <Detail k="Bottleneck" v={active.bottleneck} />
              <Detail k="Hours weekly" v={active.hoursWeekly} />
              <Detail k="Outcome goal" v={active.outcome} />
              <Detail k="Agreed to commit" v={active.agreed ? "Yes ✅" : "No"} />
              <Detail k="Submitted" v={new Date(active.submittedAt).toLocaleString()} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/50 backdrop-blur-md p-5 shadow-[var(--shadow-card)] transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary-glow opacity-10 transition-opacity group-hover:opacity-20" />
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="mt-4 text-4xl font-black tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
      {children}
    </span>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k}</p>
      <p className="mt-1 whitespace-pre-wrap text-foreground">{v || "—"}</p>
    </div>
  );
}
