import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/providers";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "RealEstate CRM", template: "%s | RealEstate CRM" },
  description: "Real Estate CRM + HRMS + EMS Platform",
  manifest: "/manifest.json",
  openGraph: {
    title: "RealEstate CRM",
    description: "Real Estate CRM + HRMS + EMS Platform",
    type: "website",
    siteName: "RealEstate CRM",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "RealEstate CRM",
    description: "Real Estate CRM + HRMS + EMS Platform",
  },
  robots: { index: false, follow: false },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
