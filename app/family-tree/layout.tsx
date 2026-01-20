import { Suspense } from "react";
import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { MobileNav } from "@/components/mobile-nav";
import { FAMILY_SURNAME } from "@/lib/utils";

export default function FamilyTreeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航栏 */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg hover:opacity-80 transition-opacity">
            {FAMILY_SURNAME}氏族谱
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/family-tree" className="hover:text-primary transition-colors">
              成员列表
            </Link>
            <Link href="/family-tree/graph" className="hover:text-primary transition-colors">
              2D 族谱
            </Link>
            <Link href="/family-tree/graph-3d" className="hover:text-primary transition-colors">
              3D 族谱
            </Link>
            <Link href="/family-tree/timeline" className="hover:text-primary transition-colors">
              时间轴
            </Link>
            <Link href="/family-tree/statistics" className="hover:text-primary transition-colors">
              统计分析
            </Link>
            <Link href="/family-tree/biography-book" className="hover:text-primary transition-colors">
              生平册
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <div className="hidden md:block">
              <Suspense fallback={<div className="h-9 w-32 bg-muted animate-pulse rounded-md" />}>
                <AuthButton />
              </Suspense>
            </div>
            <MobileNav>
              <Suspense fallback={<div className="h-9 w-full bg-muted animate-pulse rounded-md" />}>
                <AuthButton />
              </Suspense>
            </MobileNav>
          </div>
        </div>
      </header>

      {/* 页面内容 */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
