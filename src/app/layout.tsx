import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Playfair_Display,
} from "next/font/google";
import "./globals.css";
import { appConfig } from "@/content/app-config";
import { PwaRegister } from "@/components/PwaRegister";
import { SiteFooter } from "@/components/SiteFooter";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-display",
});

// Serifada estilo didone dos títulos grandes das telas de autenticação.
const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: appConfig.name,
  description: appConfig.description,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  authors: [{ name: "WorshipFlow" }],
  creator: "WorshipFlow",
  publisher: "WorshipFlow",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "WorshipFlow",
    title: appConfig.name,
    description: appConfig.description,
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "WorshipFlow" }],
  },
  twitter: {
    card: "summary_large_image",
    title: appConfig.name,
    description: appConfig.description,
    images: ["/og-image.webp"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: appConfig.name,
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07101e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <body>
        <PwaRegister />
        {children}
        <SiteFooter />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: appConfig.name,
              description: appConfig.description,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              inLanguage: "pt-BR",
              image: "/og-image.webp",
            }),
          }}
        />
      </body>
    </html>
  );
}
