import { NextLogo } from "./next-logo";
import { SupabaseLogo } from "./supabase-logo";
import { FAMILY_SURNAME } from "@/lib/utils";

export function Hero() {
  return (
    <div className="flex flex-col gap-8 lg:gap-16 items-center px-4">
      <div className="flex gap-8 justify-center items-center">
        <a
          href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
          target="_blank"
          rel="noreferrer"
        >
          <SupabaseLogo />
        </a>
        <span className="border-l rotate-45 h-6" />
        <a href="https://nextjs.org/" target="_blank" rel="noreferrer">
          <NextLogo />
        </a>
      </div>
      <h1 className="sr-only">{FAMILY_SURNAME}氏族谱管理系统</h1>
      <p className="text-2xl sm:text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
        {FAMILY_SURNAME}氏族谱管理系统
      </p>
      <p className="text-lg sm:text-xl text-muted-foreground text-center max-w-lg">
        数字化传承家族历史，可视化展示家族脉络
      </p>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
