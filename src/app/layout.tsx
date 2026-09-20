import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://kilometrowka-nine.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kilometrówka.app — ewidencja przejazdów i kalkulator",
    template: "%s · Kilometrówka.app",
  },
  description:
    "Prosta ewidencja kilometrówki i diet krajowych na 2026. Stawki Dz.U. 2023 poz. 5. Free: 10 przejazdów/mies + CSV. Premium: Excel, diety, bez limitów. Dane lokalnie w przeglądarce.",
  applicationName: "Kilometrówka.app",
  authors: [{ name: "Kilometrówka.app" }],
  keywords: [
    "kilometrówka",
    "ewidencja przejazdów",
    "dieta krajowa",
    "stawki 2026",
    "kalkulator kilometrów",
    "eksport Excel",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Kilometrówka.app — ewidencja przejazdów",
    description:
      "Ewidencja przejazdów, kalkulator kilometrówki i diet krajowych — Polska 2026. Bez konta, dane w przeglądarce.",
    url: siteUrl,
    siteName: "Kilometrówka.app",
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kilometrówka.app",
    description:
      "Ewidencja kilometrówki i diet krajowych 2026. Free + Premium.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <Header />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
