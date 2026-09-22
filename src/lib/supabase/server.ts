import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseSecretKey, supabaseUrl } from "@/lib/supabase/env";

let cached: SupabaseClient | null = null;

export function serverClient(): SupabaseClient {
  if (!cached) {
    cached = createClient(supabaseUrl(), supabaseSecretKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return cached;
}
