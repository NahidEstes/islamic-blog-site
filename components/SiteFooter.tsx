import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getSettings } from "@/lib/blog";
export async function SiteFooter() {
  const { site } = await getSettings();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link href="/" className="brand">
            <span className="brand-mark">
              <BookOpen size={23} />
            </span>
            <b>{site.name}</b>
          </Link>
          <p>{site.footerText}</p>
        </div>
        <div>
          <h3>Explore</h3>
          <Link href="/articles">Articles</Link>
          <Link href="/learn">Learn</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/tags">Tags</Link>
        </div>
        <div>
          <h3>About</h3>
          <Link href="/about">Our purpose</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/#newsletter">Newsletter</Link>
        </div>
        <div>
          <h3>Your reading</h3>
          <Link href="/account">Saved articles</Link>
          <Link href="/search">Search the blog</Link>
          <Link href="/login">Login</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        © {new Date().getFullYear()} {site.name}. All rights reserved.
      </div>
    </footer>
  );
}
