import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Kilometrówka.app — ewidencja przejazdów i kalkulator",
  description:
    "Prosta ewidencja kilometrówki i diet krajowych na 2026. Stawki Dz.U. 2023 poz. 5. Eksport CSV i Excel. Dane lokalnie w przeglądarce.",
  openGraph: {
    title: "Kilometrówka.app",
    description:
      "Ewidencja przejazdów, kalkulator kilometrówki i diet krajowych — Polska 2026.",
    locale: "pl_PL",
    type: "website",
  },
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
