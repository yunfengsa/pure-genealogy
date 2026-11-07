import { createBrowserClient } from "@supabase/ssr";
import { getBrowserPublicRuntimeConfig } from "@/components/runtime-config-provider";
import { getConfiguredCookieName } from "@/lib/runtime-config";

export function createClient() {
  const config = getBrowserPublicRuntimeConfig();
  // 同源部署直接使用浏览器自己的 origin，反代改写 Host 头也不影响 API 地址。
  const url = config.sameOrigin ? window.location.origin : config.supabaseUrl;
  return createBrowserClient(url, config.supabasePublishableKey, {
    cookieOptions: { name: getConfiguredCookieName(config) },
  });
}
