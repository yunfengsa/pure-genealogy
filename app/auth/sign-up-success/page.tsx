import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                注册成功！
              </CardTitle>
              <CardDescription>请检查您的邮箱进行确认</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                您已成功注册。请在登录前检查您的邮箱并确认您的账户。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
