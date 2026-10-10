import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import ProgressBarProvider from "@/components/providers/ProgressBarProvider";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Asia D Market | Digital Products & Services",
  description: "A modern marketplace for digital products, software, tools, courses and services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} flex min-h-screen flex-col antialiased`}>
        <AuthProvider>
          <ProgressBarProvider />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
