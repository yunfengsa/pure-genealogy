import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getConfiguredCookieName, getServerSupabaseConfig } from "@/lib/runtime-config";

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const config = getServerSupabaseConfig();

  return createServerClient(
    config.internalUrl ?? config.supabaseUrl,
    config.supabasePublishableKey,
    {
      cookieOptions: { name: getConfiguredCookieName(config) },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
