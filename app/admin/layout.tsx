import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/auth";
const links = [
  ["Dashboard", ""],
  ["Articles", "articles"],
  ["Learn Categories", "learn"],
  ["Duas", "duas"],
  ["Categories", "categories"],
  ["Tags", "tags"],
  ["Quotes", "quotes"],
  ["Comments", "comments"],
  ["Users", "users"],
  ["Newsletter", "newsletter"],
  ["Contact Messages", "messages"],
  ["Homepage", "homepage"],
  ["Site Settings", "settings"]
];
export const metadata = { robots: { index: false, follow: false } };
export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!isAdmin(user.role)) redirect("/account");
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <h2>Administration</h2>
        {links.map(([label, path]) => (
          <Link href={"/admin" + (path ? "/" + path : "")} key={label}>
            {label}
          </Link>
        ))}
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}
