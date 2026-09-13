import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { resolvePublicSeoConfig } from "@/lib/seo/publicSeo.core.mjs";
import { PUBLIC_SITE_LOGO_URL } from "@/config/publicSite";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const seo = resolvePublicSeoConfig();

export const metadata = {
  ...(seo.siteUrl ? { metadataBase: new URL(seo.siteUrl) } : {}),
  title: {
    default: "DJK/VfL Giesenkirchen 05/09 e.V.",
    template: "%s | DJK/VfL Giesenkirchen",
  },
  description:
    "Offizielle Vereinswebseite der DJK/VfL Giesenkirchen 05/09 e.V.",
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "DJK/VfL Giesenkirchen 05/09 e.V.",
    title: "DJK/VfL Giesenkirchen 05/09 e.V.",
    description: "Offizielle Vereinswebseite der DJK/VfL Giesenkirchen 05/09 e.V.",
    images: [{ url: PUBLIC_SITE_LOGO_URL, alt: "Logo der DJK/VfL Giesenkirchen" }],
  },
  twitter: {
    card: "summary",
    title: "DJK/VfL Giesenkirchen 05/09 e.V.",
    description: "Offizielle Vereinswebseite der DJK/VfL Giesenkirchen 05/09 e.V.",
    images: [PUBLIC_SITE_LOGO_URL],
  },
  robots: seo.indexingEnabled
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
