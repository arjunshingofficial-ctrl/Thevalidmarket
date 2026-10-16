import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import ProgressBarProvider from "@/components/providers/ProgressBarProvider";
import { prisma } from "@/lib/prisma";

const inter = Inter({ 
  subsets: ["latin"], 
  display: "swap", 
  preload: true 
});

import { getBaseUrl } from "@/lib/siteUrl";

const baseUrl = getBaseUrl();

export async function generateMetadata(): Promise<Metadata> {
  let settings = null;
  try {
    settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  } catch (e) {
    console.error("Failed to fetch site settings in generateMetadata:", e);
  }

  const siteName = settings?.siteName?.trim() || "The Valid Market";
  const siteDescription = settings?.siteDescription?.trim() || "Explore The Valid Market: The premier digital marketplace for premium tools, verified software licenses, expert courses, proxies, and digital assets with instant delivery.";
  const defaultOgImage = settings?.defaultOgImage?.trim() || "/og-image.jpg";

  let twitterHandle = "@TheValidMarket";
  if (settings?.footerConfig) {
    try {
      const parsed = JSON.parse(settings.footerConfig);
      if (parsed.twitterHandle) twitterHandle = parsed.twitterHandle;
    } catch {}
  }

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: `${siteName} | Premium Digital Products, Tools & Software Marketplace`,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
    keywords: [
      "digital marketplace",
      "software licenses",
      "digital products",
      "developer tools",
      "online courses",
      siteName,
      "buy digital goods",
      "instant delivery marketplace"
    ],
    authors: [{ name: `${siteName} Team`, url: baseUrl }],
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: baseUrl,
      siteName: siteName,
      title: `${siteName} | Premium Digital Products, Tools & Software Marketplace`,
      description: siteDescription,
      images: [
        {
          url: defaultOgImage,
          width: 1200,
          height: 630,
          alt: `${siteName} - Digital Marketplace`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} | Premium Digital Products, Tools & Software Marketplace`,
      description: siteDescription,
      images: [defaultOgImage],
      creator: twitterHandle,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
        { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
        { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
        { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
        { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      ],
      shortcut: "/favicon.ico",
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    manifest: "/site.webmanifest",
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "uf1qeBxnVcDdD8V4huDTRAt_WdOa8kv82GHEHEAZE4k",
      other: {
        "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || "85554159FE50FA2E9F59653F52156EC9",
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let settings = null;
  try {
    settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  } catch (e) {
    console.error("Failed to fetch site settings in RootLayout:", e);
  }

  const siteName = settings?.siteName?.trim() || "The Valid Market";
  const siteDescription = settings?.siteDescription?.trim() || undefined;

  let twitterHandle = "@TheValidMarket";
  if (settings?.footerConfig) {
    try {
      const parsed = JSON.parse(settings.footerConfig);
      if (parsed.twitterHandle) twitterHandle = parsed.twitterHandle;
    } catch {}
  }
  const twitterClean = twitterHandle.replace(/^@/, "");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": siteName,
        "url": baseUrl,
        ...(siteDescription ? { description: siteDescription } : {}),
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/logo.png`,
          "caption": `${siteName} Logo`
        },
        "sameAs": [
          "https://t.me/thevalidmarket",
          twitterClean ? `https://x.com/${twitterClean}` : "https://x.com/TheValidMarket"
        ].filter(Boolean)
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "url": baseUrl,
        "name": siteName,
        "publisher": {
          "@id": `${baseUrl}/#organization`
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${baseUrl}/store?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msvalidate.01" content={process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || "85554159FE50FA2E9F59653F52156EC9"} />
        <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "uf1qeBxnVcDdD8V4huDTRAt_WdOa8kv82GHEHEAZE4k"} />
        <link rel="preconnect" href="https://dvtmzispblbufuzoimkk.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://dvtmzispblbufuzoimkk.supabase.co" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} flex min-h-screen flex-col antialiased`}>
        <AuthProvider>
          <ProgressBarProvider />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
