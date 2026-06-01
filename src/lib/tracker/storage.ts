import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase";
import type { User } from "@supabase/supabase-js";

type Checks = Record<string, boolean>;

let currentUser: User | null = null;

if (supabase) {
  supabase.auth.getUser().then(({ data }) => {
    currentUser = data.user;
    window.dispatchEvent(new Event("supabase_auth_changed"));
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    window.dispatchEvent(new Event("supabase_auth_changed"));
  });
}

async function saveToCloud(key: string, value: any) {
  if (!supabase || !currentUser) return;
  const userId = currentUser.id;

  try {
    if (key.startsWith("checklist_")) {
      const date = key.replace("checklist_", "");
      await supabase.from("daily_checklists").upsert({
        user_id: userId,
        date: date,
        checks: value,
        updated_at: new Date().toISOString(),
      });
    } else {
      let column = "";
      if (key === "daily_scores") column = "scores";
      else if (key === "weekly_progress") column = "weekly_progress";
      else if (key === "monthly_progress") column = "monthly_progress";
      else if (key === "analytics_stats") column = "analytics_stats";
      else if (key === "weight_log") column = "weight_log";

      if (column) {
        await supabase.from("user_data").upsert({
          user_id: userId,
          [column]: value,
          updated_at: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.error(`Failed to save key ${key} to Supabase:`, err);
  }
}

async function loadFromCloud(key: string): Promise<any | null> {
  if (!supabase || !currentUser) return null;
  const userId = currentUser.id;

  try {
    if (key.startsWith("checklist_")) {
      const date = key.replace("checklist_", "");
      const { data, error } = await supabase
        .from("daily_checklists")
        .select("checks")
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle();
      if (error) throw error;
      return data?.checks ?? null;
    } else {
      let column = "";
      if (key === "daily_scores") column = "scores";
      else if (key === "weekly_progress") column = "weekly_progress";
      else if (key === "monthly_progress") column = "monthly_progress";
      else if (key === "analytics_stats") column = "analytics_stats";
      else if (key === "weight_log") column = "weight_log";

      if (column) {
        const { data, error } = await supabase
          .from("user_data")
          .select(column)
          .eq("user_id", userId)
          .maybeSingle();
        if (error) throw error;
        return data ? data[column] : null;
      }
    }
  } catch (err) {
    console.error(`Failed to load key ${key} from Supabase:`, err);
  }
  return null;
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  // 1. Initial load from local storage (so it's instant)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {}
    setLoaded(true);
  }, [key]);

  // Helper to sync from cloud
  const syncFromCloud = useCallback(async () => {
    if (!supabase || !currentUser) return;
    const cloudVal = await loadFromCloud(key);
    if (cloudVal !== null) {
      setValue(cloudVal as T);
      window.localStorage.setItem(key, JSON.stringify(cloudVal));
    } else {
      // Cloud has no data, upload local data if present
      const rawLocal = window.localStorage.getItem(key);
      if (rawLocal !== null) {
        const parsed = JSON.parse(rawLocal);
        await saveToCloud(key, parsed);
      }
    }
  }, [key]);

  // 2. Load/Auth Sync triggers
  useEffect(() => {
    if (!loaded) return;

    if (currentUser) {
      syncFromCloud();
    }

    const handleAuthChange = () => {
      if (currentUser) {
        syncFromCloud();
      } else {
        // Fallback to local storage on logout
        const raw = window.localStorage.getItem(key);
        setValue(raw != null ? (JSON.parse(raw) as T) : initial);
      }
    };

    window.addEventListener("supabase_auth_changed", handleAuthChange);
    return () => {
      window.removeEventListener("supabase_auth_changed", handleAuthChange);
    };
  }, [loaded, syncFromCloud, key, initial]);

  // 3. Write locally and to cloud
  const setLocalAndCloudValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved = newValue instanceof Function ? newValue(prev) : newValue;

      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {}

      if (supabase && currentUser) {
        saveToCloud(key, resolved);
      }

      return resolved;
    });
  }, [key]);

  const reset = useCallback(() => {
    setLocalAndCloudValue(initial);
  }, [initial, setLocalAndCloudValue]);

  return [value, setLocalAndCloudValue, reset, loaded] as const;
}

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(currentUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUser(currentUser);
    const handleAuthChange = () => {
      setUser(currentUser);
    };
    window.addEventListener("supabase_auth_changed", handleAuthChange);
    return () => {
      window.removeEventListener("supabase_auth_changed", handleAuthChange);
    };
  }, []);

  const login = async (email: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    if (!supabase) throw new Error("Supabase is not configured.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, login, verifyOtp, logout, loginWithGoogle };
}

