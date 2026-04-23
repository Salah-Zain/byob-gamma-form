import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { PerpexLogo } from "@/components/PerpexLogo";
import { addSubmission } from "@/lib/storage";
import { validateStep as zodValidateStep } from "@/lib/validation";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ChevronLeft, ChevronRight, Loader2, Send } from "lucide-react";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
      { title: "Apply — PerpeX BYOB Gamma Batch" },
      { name: "description", content: "Submit your pre-batch alignment form for PerpeX BYOB." },
    ],
  }),
  component: ApplyPage,
});

const STAGES = ["Just an idea", "Started but inconsistent", "Actively working", "Already getting customers"];
const DONE_OPTIONS = ["Research", "Validation (spoken to potential users)", "Built something", "Got first customer", "Nothing yet"];
const BOTTLENECKS = ["Clarity", "Taking action", "Sales / getting customers", "Confidence", "Consistency"];
const HOURS = ["<5 hrs", "5–10 hrs", "10–20 hrs", "20+ hrs"];

type FormState = {
  fullName: string;
  phone: string;
  stage: string;
  ideaSentence: string;
  buildingWhat: string;
  targetCustomer: string;
  problem: string;
  currentSolutions: string;
  whySwitch: string;
  doneSoFar: string[];
  bottleneck: string;
  hoursWeekly: string;
  outcome: string;
  agreed: boolean;
};

const STEP_TITLES = [
  "Basic Details",
  "Your Starting Point",
  "Reality Check",
  "Current Actions",
  "Commitment & Outcome",
  "Acknowledgement",
];

const STORAGE_KEY = "perpex_apply_form_v1";

function ApplyPage() {
  const navigate = useNavigate();
  const [logoClicks, setLogoClicks] = useState(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Initialize state from localStorage if available
  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_step`);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [form, setForm] = useState<FormState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved form", e);
      }
    }
    return {
      fullName: "", phone: "", stage: "", ideaSentence: "", buildingWhat: "",
      targetCustomer: "", problem: "", currentSolutions: "", whySwitch: "",
      doneSoFar: [], bottleneck: "", hoursWeekly: "", outcome: "", agreed: false,
    };
  });

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_step`, step.toString());
  }, [step]);

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

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleDone = (opt: string) =>
    update(
      "doneSoFar",
      form.doneSoFar.includes(opt)
        ? form.doneSoFar.filter((x) => x !== opt)
        : [...form.doneSoFar, opt]
    );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const runValidation = (s: number): string | null => {
    const result = zodValidateStep(s, form as unknown as Record<string, unknown>);
    if (result.ok) {
      setFieldErrors({});
      return null;
    }
    setFieldErrors(result.errors);
    return Object.values(result.errors)[0] ?? "Please fix the highlighted fields";
  };

  const validateField = (field: keyof FormState) => {
    // Find which step this field belongs to
    const result = zodValidateStep(step, form as unknown as Record<string, unknown>);
    if (!result.ok && result.errors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: result.errors[field] }));
    } else {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const next = () => {
    const err = runValidation(step);
    if (err) {
      toast.error(err);
      // Wait a tick for state update then scroll to first error
      setTimeout(() => {
        const firstError = document.querySelector('[aria-invalid="true"]');
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 10);
      return;
    }
    setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    setFieldErrors({});
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async () => {
    // Validate all steps before final submit
    for (let s = 0; s <= 5; s++) {
      const err = runValidation(s);
      if (err) {
        toast.error(`Step ${s + 1}: ${err}`);
        setStep(s);
        setTimeout(() => {
          const firstError = document.querySelector('[aria-invalid="true"]');
          if (firstError) {
            firstError.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 10);
        return;
      }
    }
    setSubmitting(true);
    try {
      await addSubmission(form);
      // Clear persistence on success
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(`${STORAGE_KEY}_step`);
      toast.success("Application submitted successfully!");
      navigate({ to: "/success" });
    } catch (e) {
      console.error(e);
      toast.error("Submission failed. Please try again.");
      setSubmitting(false);
    }
  };

  useEffect(() => () => { if (clickTimer.current) clearTimeout(clickTimer.current); }, []);

  const progress = ((step + 1) / STEP_TITLES.length) * 100;
  const isLast = step === STEP_TITLES.length - 1;

  return (
    <div className="h-screen overflow-hidden flex flex-col items-center justify-center bg-[var(--gradient-soft)] text-foreground relative px-6">
      <Toaster richColors position="top-center" />

      {/* Animated Background Orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      <main className="w-full max-w-3xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col max-h-[90vh]">
        <div className="mb-8 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-1000">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Gamma Batch · Pre-Batch Alignment</p>
        </div>

        {/* Progress Card */}
        <div className="group mb-6 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-md p-8 shadow-[var(--shadow-card)] transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
          <div className="mb-6 flex items-center gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-black text-primary-foreground shadow-lg shadow-primary/20">
              {step + 1}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Step {step + 1} of {STEP_TITLES.length}
                </p>
                <span className="h-1 w-1 rounded-full bg-muted" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {Math.round(progress)}% Complete
                </p>
              </div>
              <p className="text-xl font-black text-foreground">{STEP_TITLES[step]}</p>
            </div>
          </div>

          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <section
          key={step}
          className="group flex-1 overflow-y-auto rounded-3xl border border-border/50 bg-card/50 backdrop-blur-md p-8 shadow-[var(--shadow-card)] transition-all hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 animate-in zoom-in-95 slide-in-from-bottom-2 duration-500 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/20"
        >
          {step === 0 && (
            <div className="space-y-5">
              <Field label="Full Name" required error={fieldErrors.fullName}>
                <Input
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  onBlur={() => validateField("fullName")}
                  placeholder="Your full name"
                  aria-invalid={!!fieldErrors.fullName}
                  className={fieldErrors.fullName ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              </Field>
              <Field label="Phone Number" required hint="Include country code (e.g. +91 98765 43210)" error={fieldErrors.phone}>
                <Input
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d+\-\s]/g, "");
                    update("phone", val);
                  }}
                  onBlur={() => validateField("phone")}
                  placeholder="+91 98765 43210"
                  aria-invalid={!!fieldErrors.phone}
                  className={fieldErrors.phone ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <Field label="1. Which stage are you currently in?" required error={fieldErrors.stage}>
                <RadioGroup value={form.stage} onValueChange={(v) => update("stage", v)} className="grid gap-2 sm:grid-cols-2">
                  {STAGES.map((s) => (
                    <label key={s} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3 hover:border-primary/50">
                      <RadioGroupItem value={s} />
                      <span className="text-sm text-foreground">{s}</span>
                    </label>
                  ))}
                </RadioGroup>
              </Field>
              <Field label="2. Describe your business / idea in one clear sentence." required error={fieldErrors.ideaSentence}>
                <Input
                  value={form.ideaSentence}
                  onChange={(e) => update("ideaSentence", e.target.value)}
                  onBlur={() => validateField("ideaSentence")}
                  maxLength={200}
                  aria-invalid={!!fieldErrors.ideaSentence}
                  className={fieldErrors.ideaSentence ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              </Field>
              <Field label="3. What exactly are you trying to build?" hint="Be specific — avoid vague answers like 'startup'" required error={fieldErrors.buildingWhat}>
                <Textarea
                  rows={3}
                  value={form.buildingWhat}
                  onChange={(e) => update("buildingWhat", e.target.value)}
                  onBlur={() => validateField("buildingWhat")}
                  maxLength={600}
                  aria-invalid={!!fieldErrors.buildingWhat}
                  className={fieldErrors.buildingWhat ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <Field label="4. Who is your exact target customer?" required error={fieldErrors.targetCustomer}>
                <Textarea rows={2} value={form.targetCustomer} onChange={(e) => update("targetCustomer", e.target.value)}
                  onBlur={() => validateField("targetCustomer")} maxLength={400}
                  aria-invalid={!!fieldErrors.targetCustomer}
                  className={fieldErrors.targetCustomer ? "border-destructive focus-visible:ring-destructive" : ""} />
              </Field>
              <Field label="5. What real problem are you solving?" required error={fieldErrors.problem}>
                <Textarea rows={2} value={form.problem} onChange={(e) => update("problem", e.target.value)}
                  onBlur={() => validateField("problem")} maxLength={400}
                  aria-invalid={!!fieldErrors.problem}
                  className={fieldErrors.problem ? "border-destructive focus-visible:ring-destructive" : ""} />
              </Field>
              <Field label="6. How are people currently solving this problem?" required error={fieldErrors.currentSolutions}>
                <Textarea rows={2} value={form.currentSolutions} onChange={(e) => update("currentSolutions", e.target.value)}
                  onBlur={() => validateField("currentSolutions")} maxLength={400}
                  aria-invalid={!!fieldErrors.currentSolutions}
                  className={fieldErrors.currentSolutions ? "border-destructive focus-visible:ring-destructive" : ""} />
              </Field>
              <Field label="7. Why would they switch to you?" required error={fieldErrors.whySwitch}>
                <Textarea rows={2} value={form.whySwitch} onChange={(e) => update("whySwitch", e.target.value)}
                  onBlur={() => validateField("whySwitch")} maxLength={400}
                  aria-invalid={!!fieldErrors.whySwitch}
                  className={fieldErrors.whySwitch ? "border-destructive focus-visible:ring-destructive" : ""} />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <Field label="8. What have you already done?" hint="Select all that apply" required error={fieldErrors.doneSoFar}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {DONE_OPTIONS.map((opt) => (
                    <label key={opt} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3 hover:border-primary/50">
                      <Checkbox checked={form.doneSoFar.includes(opt)} onCheckedChange={() => toggleDone(opt)} />
                      <span className="text-sm text-foreground">{opt}</span>
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="9. What is your biggest bottleneck right now?" required error={fieldErrors.bottleneck}>
                <RadioGroup value={form.bottleneck} onValueChange={(v) => update("bottleneck", v)} className="grid gap-2 sm:grid-cols-2">
                  {BOTTLENECKS.map((b) => (
                    <label key={b} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3 hover:border-primary/50">
                      <RadioGroupItem value={b} />
                      <span className="text-sm text-foreground">{b}</span>
                    </label>
                  ))}
                </RadioGroup>
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <Field label="10. How many hours can you dedicate weekly?" required error={fieldErrors.hoursWeekly}>
                <RadioGroup value={form.hoursWeekly} onValueChange={(v) => update("hoursWeekly", v)} className="grid gap-2 sm:grid-cols-4">
                  {HOURS.map((h) => (
                    <label key={h} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3 hover:border-primary/50">
                      <RadioGroupItem value={h} />
                      <span className="text-sm text-foreground">{h}</span>
                    </label>
                  ))}
                </RadioGroup>
              </Field>
              <Field label="11. By the end of this BYOB batch, clearly describe what you aim to achieve." hint="Be specific — revenue, customers, launch, MVP, etc." required error={fieldErrors.outcome}>
                <Textarea rows={3} value={form.outcome} onChange={(e) => update("outcome", e.target.value)}
                  onBlur={() => validateField("outcome")} maxLength={600}
                  aria-invalid={!!fieldErrors.outcome}
                  className={fieldErrors.outcome ? "border-destructive focus-visible:ring-destructive" : ""} />
              </Field>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <p className="text-sm font-semibold text-foreground">12. I understand that:</p>
                <ul className="mt-3 space-y-1.5 text-sm text-foreground/80">
                  <li>• This is an execution-focused program, not just learning</li>
                  <li>• I will be expected to take action consistently</li>
                  <li>• I may receive direct and honest feedback</li>
                  <li>• My results depend on my effort and consistency</li>
                </ul>
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3">
                  <Checkbox checked={form.agreed} onCheckedChange={(v) => update("agreed", Boolean(v))} className="mt-0.5" />
                  <span className="text-sm font-medium text-foreground">
                    I agree to fully commit to this process.
                  </span>
                </label>
                {fieldErrors.agreed && (
                  <p className="mt-2 text-xs font-medium text-destructive" role="alert">{fieldErrors.agreed}</p>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={back}
            disabled={step === 0 || submitting}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>

          {!isLast ? (
            <Button type="button" variant="hero" size="lg" onClick={next}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" variant="hero" size="lg" onClick={onSubmit} disabled={submitting}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
              ) : (
                <>Submit Application <Send className="h-4 w-4" /></>
              )}
            </Button>
          )}
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Your responses are reviewed by the PerpeX team.
        </p>
      </main>
    </div>
  );
}

function SectionHead({ n, title }: { n: number; title: string }) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-black text-primary-foreground shadow-lg shadow-primary/20">
        {n}
      </span>
      <h2 className="text-xl font-black tracking-tight text-foreground/80">{title}</h2>
    </div>
  );
}

function Field({ label, hint, required, error, children }: { label: string; hint?: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <Label className="text-[13px] font-extrabold uppercase tracking-wide text-foreground/60">
        {label}
        {required && <span className="ml-1 text-destructive font-black">*</span>}
      </Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
      {error && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
