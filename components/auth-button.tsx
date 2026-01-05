import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return user ? (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 w-full md:w-auto">
      <span className="text-sm font-medium truncate max-w-[200px] md:max-w-none mb-2 md:mb-0">
        你好, {user.email}!
      </span>
      <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
        <Button asChild size="sm" variant={"outline"} className="w-full md:w-auto">
          <Link href="/family-tree">数据维护</Link>
        </Button>
        <LogoutButton className="w-full md:w-auto" />
      </div>
    </div>
  ) : (
    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
      <Button asChild size="sm" variant={"outline"} className="w-full md:w-auto">
        <Link href="/auth/login">登录</Link>
      </Button>
      <Button asChild size="sm" variant={"default"} className="w-full md:w-auto">
        <Link href="/auth/sign-up">注册</Link>
      </Button>
    </div>
  );
}
