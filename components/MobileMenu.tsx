"use client";
import Link from "next/link";
import { Menu } from "lucide-react";

export function MobileMenu({
  links,
  loggedIn
}: {
  links: string[][];
  loggedIn: boolean;
}) {
  return (
    <details className="mobile-menu">
      <summary aria-label="Menu">
        <Menu />
      </summary>
      <nav
        aria-label="Mobile navigation"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) {
            event.currentTarget.closest("details")?.removeAttribute("open");
          }
        }}
      >
        {links.map(([label, href]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
        <Link href="/search">Search</Link>
        <Link href={loggedIn ? "/account" : "/login"}>
          {loggedIn ? "Profile" : "Login"}
        </Link>
      </nav>
    </details>
  );
}
