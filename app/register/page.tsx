import { redirect } from "next/navigation";
import { AuthForm } from "@/components/forms/AuthForm";
import { getSession } from "@/lib/auth";
export default async function RegisterPage() {
  if (await getSession()) redirect("/account");
  return (
    <div className="auth-shell">
      <h1>Create your account</h1>
      <p>Save articles, share thoughtful comments, and keep reading.</p>
      <AuthForm mode="register" />
    </div>
  );
}
