import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getSettings } from "@/lib/blog";
import "./globals.css";
const bangla = localFont({
  src: "../public/fonts/NotoSerifBengali.ttf",
  variable: "--font-bangla",
  display: "swap",
  weight: "100 900"
});
export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getSettings();
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    ),
    title: {
      default: site.name + " — Articles & Reflections",
      template: "%s | " + site.name
    },
    description: site.description,
    openGraph: {
      title: site.name,
      description: site.description,
      type: "website",
      images: ["/images/blog-books.png"]
    },
    twitter: { card: "summary_large_image" }
  };
}
export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const { site } = await getSettings();
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  };
  return (
    <html
      lang="en"
      className={bangla.variable}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('noor-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark';document.documentElement.style.colorScheme=document.documentElement.dataset.theme}catch(e){}"
          }}
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content" className="site-main">
          {children}
        </main>
        <SiteFooter />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organization).replace(/</g, "\\u003c")
          }}
        />
      </body>
    </html>
  );
}
