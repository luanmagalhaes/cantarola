export function supabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!value) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL ausente");
  }

  return value;
}

export function supabasePublishableKey(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!value) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ausente");
  }

  return value;
}

export function supabaseSecretKey(): string {
  const value = process.env.SUPABASE_SECRET_KEY;

  if (!value) {
    throw new Error("SUPABASE_SECRET_KEY ausente");
  }

  return value;
}
