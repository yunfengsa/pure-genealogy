import { getServerSupabaseConfig } from "@/lib/runtime-config";

// 服务端读取家族姓氏：优先取数据库 site_settings，缺失则用环境变量兜底。
// 结果做短时缓存，避免每次渲染都打数据库。
type Env = Record<string, string | undefined>;

let cache: { value: string; ts: number } | null = null;
const TTL_MS = 10_000;

export async function getFamilySurname(env: Env = process.env): Promise<string> {
  const fallback = env["NEXT_PUBLIC_FAMILY_SURNAME"]?.trim() || "刘";
  const now = Date.now();
  if (cache && now - cache.ts < TTL_MS) return cache.value;
  try {
    // 复用上游配置：自托管走 SUPABASE_INTERNAL_URL（容器内网），云端走项目 URL。
    const { supabaseUrl, supabasePublishableKey, internalUrl } = getServerSupabaseConfig(env);
    const base = internalUrl || supabaseUrl;
    const res = await fetch(
      `${base}/rest/v1/site_settings?key=eq.family_surname&select=value`,
      {
        headers: {
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${supabasePublishableKey}`,
        },
      },
    );
    if (res.ok) {
      const rows = (await res.json()) as Array<{ value?: string }>;
      const v = rows?.[0]?.value?.trim();
      if (v) {
        cache = { value: v, ts: now };
        return v;
      }
    }
  } catch {
    // 表尚未创建、网络不通或配置缺失时退回环境变量，不阻断页面渲染。
  }
  return fallback;
}

export function clearFamilySurnameCache(): void {
  cache = null;
}
