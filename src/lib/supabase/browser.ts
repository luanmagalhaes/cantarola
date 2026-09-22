"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";

let cached: SupabaseClient | null = null;

export function browserClient(): SupabaseClient {
  if (!cached) {
    cached = createClient(supabaseUrl(), supabasePublishableKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }

  return cached;
}
