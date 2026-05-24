import { loginAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage({
  searchParams
}: {
  searchParams?: { error?: string; next?: string };
}) {
  const nextPath = searchParams?.next ?? "/dashboard";
  const hasError = searchParams?.error === "1";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-sm text-slate-500">ZEEOX Business System</p>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="grid gap-4">
            <input type="hidden" name="next" value={nextPath} />
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" autoComplete="username" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            {hasError ? <p className="text-sm text-rose-600">Invalid username or password.</p> : null}
            <Button type="submit">Sign in</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
