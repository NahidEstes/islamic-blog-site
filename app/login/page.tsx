import { redirect } from "next/navigation";
import { AuthForm } from "@/components/forms/AuthForm";
import { getSession } from "@/lib/auth";
export default async function LoginPage() {
  if (await getSession()) redirect("/account");
  return (
    <div className="auth-shell">
      <h1>Welcome back</h1>
      <p>Sign in to access saved articles and your profile.</p>
      <AuthForm mode="login" />
    </div>
  );
}
