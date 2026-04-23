import { supabase } from "@/integrations/supabase/client";

export type Submission = {
  id: string;
  submittedAt: string;
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

type Row = {
  id: string;
  submitted_at: string;
  full_name: string;
  phone: string;
  stage: string;
  idea_sentence: string;
  building_what: string;
  target_customer: string;
  problem: string;
  current_solutions: string;
  why_switch: string;
  done_so_far: string[];
  bottleneck: string;
  hours_weekly: string;
  outcome: string;
  agreed: boolean;
};

const fromRow = (r: Row): Submission => ({
  id: r.id,
  submittedAt: r.submitted_at,
  fullName: r.full_name,
  phone: r.phone,
  stage: r.stage,
  ideaSentence: r.idea_sentence,
  buildingWhat: r.building_what,
  targetCustomer: r.target_customer,
  problem: r.problem,
  currentSolutions: r.current_solutions,
  whySwitch: r.why_switch,
  doneSoFar: r.done_so_far ?? [],
  bottleneck: r.bottleneck,
  hoursWeekly: r.hours_weekly,
  outcome: r.outcome,
  agreed: r.agreed,
});

export async function getSubmissions(): Promise<Submission[]> {
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => fromRow(r as Row));
}

export async function addSubmission(s: Omit<Submission, "id" | "submittedAt">): Promise<void> {
  const { error } = await supabase.from("submissions").insert({
    full_name: s.fullName,
    phone: s.phone,
    stage: s.stage,
    idea_sentence: s.ideaSentence,
    building_what: s.buildingWhat,
    target_customer: s.targetCustomer,
    problem: s.problem,
    current_solutions: s.currentSolutions,
    why_switch: s.whySwitch,
    done_so_far: s.doneSoFar,
    bottleneck: s.bottleneck,
    hours_weekly: s.hoursWeekly,
    outcome: s.outcome,
    agreed: s.agreed,
  });
  if (error) throw error;
}

// ===== Admin auth (Supabase) =====
const ADMIN_EMAIL = "admin@perpex.app";

export async function adminLogin(username: string, password: string): Promise<boolean> {
  // Accept "admin" username or full admin email
  const email = username.trim().toLowerCase() === "admin" ? ADMIN_EMAIL : username.trim();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return false;
  // Verify role
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roles) {
    await supabase.auth.signOut();
    return false;
  }
  return true;
}

export async function adminLogout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function isAdminLoggedIn(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return false;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}
