import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import ProgressBarProvider from "@/components/providers/ProgressBarProvider";
import Script from "next/script";

const inter = Inter({ 
  subsets: ["latin"], 
  display: "swap",
  preload: true 
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://asiadmarket.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Asia D Market | Premium Digital Products, Tools & Software Marketplace",
    template: "%s | Asia D Market",
  },
  description: "Explore Asia D Market: The premier digital marketplace for premium tools, verified software licenses, expert courses, proxies, and digital assets with instant delivery.",
  keywords: [
    "digital marketplace",
    "software licenses",
    "digital products",
    "developer tools",
    "online courses",
    "Asia D Market",
    "buy digital goods",
    "instant delivery marketplace"
  ],
  authors: [{ name: "Asia D Market Team", url: baseUrl }],
  creator: "Asia D Market",
  publisher: "Asia D Market",
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
    siteName: "Asia D Market",
    title: "Asia D Market | Premium Digital Products, Tools & Software Marketplace",
    description: "Explore Asia D Market: The premier digital marketplace for premium tools, verified software licenses, expert courses, proxies, and digital assets.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Asia D Market - Digital Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Asia D Market | Premium Digital Products, Tools & Software Marketplace",
    description: "The premier digital marketplace for premium tools, verified software licenses, expert courses, proxies, and digital assets.",
    images: ["/og-image.jpg"],
    creator: "@AsiaDMarket",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": "Asia D Market",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/logo.png`,
          "caption": "Asia D Market Logo"
        },
        "sameAs": [
          "https://t.me/asiadmarket",
          "https://twitter.com/AsiaDMarket"
        ]
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "url": baseUrl,
        "name": "Asia D Market",
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
