-- 站点级设置（当前用于保存家族姓氏）。
-- 云端 Supabase 部署：在 SQL Editor 中执行本脚本（仅一次）。
-- 自托管部署：由 00-init.sh 在数据库首次初始化时自动执行。
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_settings_anon_select ON public.site_settings;
CREATE POLICY site_settings_anon_select ON public.site_settings
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS site_settings_auth_all ON public.site_settings;
CREATE POLICY site_settings_auth_all ON public.site_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
REVOKE ALL ON public.site_settings FROM anon;
GRANT SELECT ON public.site_settings TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated, service_role;
