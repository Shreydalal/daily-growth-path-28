import { useState } from "react";
import { useAuth } from "@/lib/tracker/storage";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Mail, KeyRound, Loader2, Sparkles, X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, verifyOtp, loading, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");

  if (!isOpen) return null;

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await login(email);
      toast.success("Verification code sent to your email!");
      setStep("code");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to send code. Please try again.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !email.trim()) return;

    try {
      await verifyOtp(email, code);
      toast.success("Successfully logged in! Your progress is syncing.");
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Invalid or expired code. Please try again.");
    }
  };

  const isConfigured = !!supabase;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 bg-card border rounded-2xl shadow-xl animate-in scale-in duration-200 mx-4">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-muted transition-colors"
        >
          <X className="size-4" />
        </button>

        {!isConfigured ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-center size-12 rounded-full bg-yellow-500/10 text-yellow-500 mx-auto">
              <Sparkles className="size-6" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold">Cloud Sync Setup Required</h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Supabase configuration variables are not set yet. To enable multi-device sync, you will need to:
              </p>
            </div>
            <div className="text-xs space-y-2 bg-muted p-4 rounded-xl font-mono text-left leading-relaxed">
              <p>1. Create a free project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-primary underline">supabase.com</a>.</p>
              <p>2. Create <code className="bg-background px-1 py-0.5 rounded">daily_checklists</code> and <code className="bg-background px-1 py-0.5 rounded">user_data</code> tables.</p>
              <p>3. Create a <code className="bg-background px-1 py-0.5 rounded">.env</code> file in this folder and add:</p>
              <p className="font-semibold text-primary select-all">VITE_SUPABASE_URL=your_project_url<br />VITE_SUPABASE_ANON_KEY=your_anon_key</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-sm"
            >
              Continue Offline
            </button>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
                <Sparkles className="size-3" /> Transformation Cloud Sync
              </div>
              <h2 className="text-xl font-bold">Access Sync on Any Device</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Enter your email or continue with Google to start syncing.
              </p>
            </div>

            {step === "email" ? (
              <div className="space-y-4">
                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        id="email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-sm focus:border-primary outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Sending Code...
                      </>
                    ) : (
                      "Send Verification Code"
                    )}
                  </button>
                </form>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground font-medium">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await loginWithGoogle();
                    } catch (err: any) {
                      toast.error(err.message || "Failed to start Google Sign-In.");
                    }
                  }}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border bg-background hover:bg-muted font-semibold transition-colors disabled:opacity-50 text-sm"
                >
                  <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="code" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      id="code"
                      type="text"
                      maxLength={6}
                      required
                      placeholder="000000"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-sm tracking-[0.2em] font-mono text-center focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Sent to <span className="font-semibold text-foreground">{email}</span>.{" "}
                    <button
                      type="button"
                      onClick={() => setStep("email")}
                      className="text-primary hover:underline font-semibold"
                    >
                      Change Email
                    </button>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Verifying Code...
                    </>
                  ) : (
                    "Confirm & Sync"
                  )}
                </button>
              </form>
            )}

            <div className="text-[10px] text-muted-foreground text-center leading-relaxed">
              Your offline history is automatically merged when you log in.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
