import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      if (!supabase) {
        setError("Supabase is not configured.");
        return;
      }

      try {
        // Parse search params using URLSearchParams
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const next = params.get("next") || "/";

        if (code) {
          // Exchange the code for a session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          
          toast.success("Successfully signed in!");
          navigate({ to: next });
        } else {
          // No code found, check if there is an active session (e.g. from hash fragment)
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            navigate({ to: next });
          } else {
            // No session or code, redirect to login
            navigate({ to: "/login" });
          }
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "Authentication failed.");
        toast.error("Failed to complete authentication.");
        // Redirect to login after a delay
        setTimeout(() => {
          navigate({ to: "/login" });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        {error ? (
          <div className="space-y-2">
            <div className="text-red-500 font-semibold">Authentication Error</div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground mt-4 animate-pulse">Redirecting to login...</p>
          </div>
        ) : (
          <>
            <Loader2 className="size-8 animate-spin text-primary" />
            <div className="space-y-1">
              <h2 className="font-semibold text-lg">Completing sign-in...</h2>
              <p className="text-sm text-muted-foreground">
                Please wait while we sync your secure session.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
