import Link from "next/link";
import { BookOpen, Search, UserRound } from "lucide-react";
import { MobileMenu } from "@/components/MobileMenu";
import { getSettings } from "@/lib/blog";
import { getSession } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  ["Home", "/"],
  ["Articles", "/articles"],
  ["Categories", "/categories"],
  ["About", "/about"],
  ["Contact", "/contact"]
];
export async function SiteHeader() {
  const session = await getSession();
  const { site } = await getSettings();
  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <BookOpen size={23} />
          </span>
          <b>{site.name}</b>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <Link className="icon-link" href="/search" aria-label="Search">
            <Search size={22} />
          </Link>
          <Link
            className="button button-outline"
            href={session ? "/account" : "/login"}
          >
            <UserRound size={17} />
            {session ? "Profile" : "Login"}
          </Link>
        </div>
        <MobileMenu links={links} loggedIn={Boolean(session)} />
      </div>
    </header>
  );
}
