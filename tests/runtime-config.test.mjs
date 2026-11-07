import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTypeScript } from "./helpers/load-typescript.mjs";

const runtime = loadTypeScript("lib/runtime-config.ts");
const env = {
  NEXT_PUBLIC_SUPABASE_URL: "https://public.example",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  NEXT_PUBLIC_FAMILY_SURNAME: "张",
};
const jwt = (role) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.signature`;

test("公开配置按调用读取运行时环境，切换 A/B 不保留模块加载值", () => {
  assert.equal(runtime.getPublicRuntimeConfig(env).familySurname, "张");
  assert.deepEqual(runtime.getPublicRuntimeConfig({ ...env, NEXT_PUBLIC_SUPABASE_URL: "https://b.example", NEXT_PUBLIC_FAMILY_SURNAME: "李" }), {
    supabaseUrl: "https://b.example", sameOrigin: false, supabasePublishableKey: "sb_publishable_test", familySurname: "李",
  });
  const previous = { ...process.env };
  try {
    Object.assign(process.env, env);
    assert.equal(runtime.getPublicRuntimeConfig().familySurname, "张");
    process.env.NEXT_PUBLIC_FAMILY_SURNAME = "陈";
    assert.equal(runtime.getPublicRuntimeConfig().familySurname, "陈");
  } finally {
    for (const key of Object.keys(env)) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});

test("公开对象和安全 JSON 不含内部 URL、secret，script 结束符不能逃逸", () => {
  const config = runtime.getPublicRuntimeConfig({ ...env, NEXT_PUBLIC_FAMILY_SURNAME: '</script><script>globalThis.pwned=true</script>\u2028', SUPABASE_INTERNAL_URL: "http://gateway:8000", SUPABASE_SERVICE_ROLE_KEY: "private-secret" });
  assert.deepEqual(Object.keys(config).sort(), ["familySurname", "sameOrigin", "supabasePublishableKey", "supabaseUrl"]);
  const json = runtime.serializePublicRuntimeConfig(config);
  assert.doesNotMatch(json, /<|>|gateway|private-secret|\u2028/);
  assert.deepEqual(JSON.parse(json), config);
});

test("缺少配置、非 HTTP(S)、带凭据的 URL 与私密 key 被拒绝", () => {
  for (const replacement of ["postgres://db:5432/postgres", "javascript:alert(1)", "https://user:pass@example.com"]) {
    assert.throws(() => runtime.getPublicRuntimeConfig({ ...env, NEXT_PUBLIC_SUPABASE_URL: replacement }), /NEXT_PUBLIC_SUPABASE_URL/);
  }
  for (const key of ["", "sb_secret_private", jwt("service_role"), "not-a-public-key", jwt("authenticated")]) {
    assert.throws(() => runtime.getPublicRuntimeConfig({ ...env, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key }), /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  }
  assert.equal(runtime.getPublicRuntimeConfig({ ...env, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwt("anon") }).supabasePublishableKey, jwt("anon"));
  assert.throws(() => runtime.getServerSupabaseConfig({ ...env, SUPABASE_INTERNAL_URL: "postgres://db" }), /SUPABASE_INTERNAL_URL/);
});

test("SSR 内部地址与浏览器公共地址共享原有 cookie 身份", async () => {
  const config = runtime.getServerSupabaseConfig({ ...env, SUPABASE_INTERNAL_URL: "http://gateway:8000" });
  assert.equal(config.internalUrl, "http://gateway:8000");
  assert.equal(runtime.getSupabaseCookieName(config.supabaseUrl), "sb-public-auth-token");
  assert.equal(runtime.getServerSupabaseConfig({ ...env, SUPABASE_INTERNAL_URL: "" }).internalUrl, undefined);
  let serverArgs;
  let browserArgs;
  const server = loadTypeScript("lib/supabase/server.ts", {
    "@/lib/runtime-config": { ...runtime, getServerSupabaseConfig: () => config },
    "next/headers": { cookies: async () => ({ getAll: () => [], set: () => {} }) },
    "@supabase/ssr": { createServerClient: (...args) => { serverArgs = args; return {}; } },
  });
  const browser = loadTypeScript("lib/supabase/client.ts", {
    "@/lib/runtime-config": runtime,
    "@/components/runtime-config-provider": { getBrowserPublicRuntimeConfig: () => runtime.getPublicRuntimeConfig(env) },
    "@supabase/ssr": { createBrowserClient: (...args) => { browserArgs = args; return {}; } },
  });
  await server.createClient();
  browser.createClient();
  assert.equal(serverArgs[0], "http://gateway:8000");
  assert.equal(browserArgs[0], "https://public.example");
  assert.equal(serverArgs[2].cookieOptions.name, browserArgs[2].cookieOptions.name);
});

test("不配置公开地址时按同源部署，浏览器使用当前 origin", async () => {
  const sameOriginEnv = { ...env };
  delete sameOriginEnv.NEXT_PUBLIC_SUPABASE_URL;
  const config = runtime.getPublicRuntimeConfig(sameOriginEnv);
  assert.equal(config.sameOrigin, true);
  assert.equal(config.supabaseUrl, "");
  assert.equal(runtime.getConfiguredCookieName(config), "sb-auth-token");
  assert.throws(() => runtime.getServerSupabaseConfig(sameOriginEnv), /SUPABASE_INTERNAL_URL/);
  const serverConfig = runtime.getServerSupabaseConfig({ ...sameOriginEnv, SUPABASE_INTERNAL_URL: "http://gateway:8000" });

  let browserArgs;
  const browser = loadTypeScript("lib/supabase/client.ts", {
    "@/lib/runtime-config": runtime,
    "@/components/runtime-config-provider": { getBrowserPublicRuntimeConfig: () => serverConfig },
    "@supabase/ssr": { createBrowserClient: (...args) => { browserArgs = args; return {}; } },
  });
  const previousWindow = globalThis.window;
  try {
    globalThis.window = { location: { origin: "https://genealogy.example" } };
    browser.createClient();
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
  assert.equal(browserArgs[0], "https://genealogy.example");
  assert.equal(browserArgs[2].cookieOptions.name, "sb-auth-token");
});

test("浏览器同步接口读取 DOM 配置，Context 保留服务端传入配置", () => {
  const provider = loadTypeScript("components/runtime-config-provider.tsx");
  const config = runtime.getPublicRuntimeConfig(env);
  const previousDocument = globalThis.document;
  try {
    globalThis.document = { getElementById: (id) => {
      assert.equal(id, "public-runtime-config");
      return { textContent: runtime.serializePublicRuntimeConfig(config) };
    } };
    assert.deepEqual(provider.getBrowserPublicRuntimeConfig(), config);
    const element = provider.RuntimeConfigProvider({ config, children: "内容" });
    assert.equal(element.props.value, config);
    assert.equal(element.props.children, "内容");
    globalThis.document = { getElementById: () => null };
    assert.throws(() => provider.getBrowserPublicRuntimeConfig(), /缺少浏览器运行时配置/);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});

test("健康路由无需配置或 Supabase，proxy 绕过认证", async () => {
  const route = loadTypeScript("app/api/health/route.ts");
  assert.deepEqual(await route.GET().json(), { status: "ok" });
  const proxy = loadTypeScript("lib/supabase/proxy.ts", {
    "@/lib/runtime-config": { getServerSupabaseConfig: () => { throw new Error("不应读取配置"); } },
    "@supabase/ssr": { createServerClient: () => { throw new Error("不应连接认证服务"); } },
    "next/server": { NextResponse: { next: () => ({ status: 200 }) } },
  });
  assert.equal((await proxy.updateSession({ nextUrl: { pathname: "/api/health" } })).status, 200);
});

test("容器启动校验失败不启动服务且不泄漏 key；有效配置转发 SIGTERM", async () => {
  const fs = await import("node:fs/promises");
  const os = await import("node:os");
  const path = await import("node:path");
  const { spawn } = await import("node:child_process");
  const { once } = await import("node:events");
  const ts = (await import("typescript")).default;
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "genealogy-entrypoint-"));
  try {
    await fs.mkdir(path.join(directory, "docker"));
    await fs.copyFile("docker/entrypoint.mjs", path.join(directory, "docker/entrypoint.mjs"));
    const compiled = ts.transpileModule(await fs.readFile("lib/runtime-config.ts", "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    await fs.writeFile(path.join(directory, "docker/runtime-config.cjs"), compiled);
    await fs.writeFile(path.join(directory, "server.js"), `
      console.log("READY");
      setInterval(() => {}, 1000);
      process.on("SIGTERM", () => { console.log("TERM_FORWARDED"); process.exit(0); });
    `);
    const runEnv = { ...process.env, ...env };
    delete runEnv.SUPABASE_INTERNAL_URL;
    const rejected = spawn(process.execPath, ["docker/entrypoint.mjs"], {
      cwd: directory, env: { ...runEnv, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_do_not_log" },
    });
    let rejectedOutput = "";
    rejected.stdout.on("data", (data) => { rejectedOutput += data; });
    rejected.stderr.on("data", (data) => { rejectedOutput += data; });
    const [rejectedCode] = await once(rejected, "exit");
    assert.equal(rejectedCode, 1);
    assert.match(rejectedOutput, /应用配置无效/);
    assert.doesNotMatch(rejectedOutput, /sb_secret_do_not_log|READY/);

    const accepted = spawn(process.execPath, ["docker/entrypoint.mjs"], { cwd: directory, env: runEnv });
    let acceptedOutput = "";
    accepted.stderr.resume();
    const exit = once(accepted, "exit");
    try {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("应用未启动")), 5000);
        accepted.stdout.on("data", (data) => {
          acceptedOutput += data;
          if (acceptedOutput.includes("READY")) { clearTimeout(timeout); resolve(); }
        });
      });
      accepted.kill("SIGTERM");
      const [acceptedCode] = await exit;
      assert.equal(acceptedCode, 0);
      assert.match(acceptedOutput, /TERM_FORWARDED/);
    } finally {
      if (accepted.exitCode === null) accepted.kill("SIGKILL");
    }
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
