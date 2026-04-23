import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type GuardState = "checking" | "authorized" | "denied";

export function useAdminGuard(): { state: GuardState } {
  const navigate = useNavigate();
  const [state, setState] = useState<GuardState>("checking");

  useEffect(() => {
    let mounted = true;

    const check = async (showToastOnDeny: boolean) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (!mounted) return;
        if (showToastOnDeny) toast.error("Please sign in as admin to access this page");
        setState("denied");
        navigate({ to: "/admin/login" });
        return;
      }
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!mounted) return;
      if (!role) {
        toast.error("Access denied — admin privileges required");
        setState("denied");
        await supabase.auth.signOut();
        navigate({ to: "/admin/login" });
        return;
      }
      setState("authorized");
    };

    check(true);

    // React to auth changes (logout in another tab, session expiry)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        if (!mounted) return;
        setState("denied");
        navigate({ to: "/admin/login" });
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return { state };
}
