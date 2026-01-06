import { LoginForm } from "@/components/login-form";
import Image from "next/image";

export default function Page() {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/login-bg.jpg"
          alt="Family Tree Background"
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />
      </div>
      <div className="w-full max-w-sm z-10">
        <LoginForm />
      </div>
    </div>
  );
}
