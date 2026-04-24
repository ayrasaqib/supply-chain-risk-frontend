// app/layout.tsx
import "./globals.css";
import { AmplifyProvider } from "@/lib/amplify-provider";
import { AuthProvider } from "@/lib/auth-context";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IntelliSupply",
  description:
    "Real-time supply chain risk prediction and monitoring system for global logistics operations",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <AmplifyProvider>
          <AuthProvider>{children}</AuthProvider>
        </AmplifyProvider>

        <Analytics />
      </body>
    </html>
  );
}
