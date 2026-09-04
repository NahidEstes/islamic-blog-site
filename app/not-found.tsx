import { ButtonLink } from "@/components/ui/Button";
export default function NotFound() {
  return (
    <div className="auth-shell">
      <h1>Page not found</h1>
      <p>The page may have moved or no longer exists.</p>
      <div style={{ textAlign: "center" }}>
        <ButtonLink href="/" variant="green">
          Return home
        </ButtonLink>
      </div>
    </div>
  );
}
