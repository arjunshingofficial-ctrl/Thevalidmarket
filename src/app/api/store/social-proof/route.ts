import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export interface SocialProofProduct {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  price: number;
  image: string;
  stars: number;
}

const FALLBACK_PRODUCTS: SocialProofProduct[] = [
  {
    id: "fb-cc-usa",
    name: "United States CVV",
    displayName: "UNITED STATES OF AMERICA CVV",
    slug: "visa",
    price: 35,
    image: "/images/cards/cards-deck.jpg",
    stars: 5,
  },
  {
    id: "fb-cc-uk",
    name: "United Kingdom CVV",
    displayName: "UNITED KINGDOM MASTERCARD CVV",
    slug: "mastercard",
    price: 32,
    image: "/images/cards/cards-deck.jpg",
    stars: 5,
  },
  {
    id: "fb-cc-amex",
    name: "American Express Gold",
    displayName: "AMERICAN EXPRESS GOLD CARD",
    slug: "american-express",
    price: 45,
    image: "/images/cards/cards-deck.jpg",
    stars: 5,
  },
  {
    id: "fb-socks-win",
    name: "Socks 5 For Windows",
    displayName: "SOCKS 5 PROXY FOR WINDOWS",
    slug: "socks-5-windows",
    price: 100,
    image: "https://dvtmzispblbufuzoimkk.supabase.co/storage/v1/object/public/asia-d-market/public/uploads/Socks5-for-Windows-Global-Access-c0e273fd.webp",
    stars: 5,
  },
  {
    id: "fb-socks-android",
    name: "Socks 5 For Android",
    displayName: "SOCKS 5 PROXY FOR ANDROID",
    slug: "socks-5-android",
    price: 50,
    image: "https://dvtmzispblbufuzoimkk.supabase.co/storage/v1/object/public/asia-d-market/public/uploads/Android-SOCKS5-Global-Proxy-Banner-e9af99fa.webp",
    stars: 5,
  },
  {
    id: "fb-rdp-pro",
    name: "RDP Pro Server",
    displayName: "RDP PRO DEDICATED SERVER",
    slug: "rdp-pro",
    price: 25,
    image: "/images/products/rdp-server.jpg",
    stars: 5,
  },
  {
    id: "fb-course-carding",
    name: "Carding Masterclass 2026",
    displayName: "CARDING MASTERCLASS & CURRICULUM",
    slug: "carding-course",
    price: 89,
    image: "/images/cards/cards-deck.jpg",
    stars: 5,
  },
  {
    id: "fb-cc-germany",
    name: "Germany Visa CVV",
    displayName: "GERMANY VISA PLATINUM CVV",
    slug: "visa",
    price: 38,
    image: "/images/cards/cards-deck.jpg",
    stars: 4,
  },
];

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        salePrice: true,
        metadata: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        course: {
          select: {
            thumbnailUrl: true,
          },
        },
        fieldValues: {
          select: {
            value: true,
            field: {
              select: {
                slug: true,
                name: true,
              },
            },
          },
        },
      },
      take: 60,
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!products || products.length === 0) {
      return NextResponse.json({ products: FALLBACK_PRODUCTS });
    }

    const formatted: SocialProofProduct[] = products.map((p) => {
      let image = "/images/cards/cards-deck.jpg";
      try {
        if (p.metadata) {
          const parsed = typeof p.metadata === "string" ? JSON.parse(p.metadata) : p.metadata;
          if (parsed?.image) {
            image = parsed.image;
          }
        }
      } catch {
        // ignore parse error
      }

      if (p.course?.thumbnailUrl) {
        image = p.course.thumbnailUrl;
      }

      const isCC =
        p.category?.slug?.toLowerCase() === "cc" ||
        p.category?.name?.toLowerCase() === "cc" ||
        p.name.toLowerCase().includes("visa") ||
        p.name.toLowerCase().includes("mastercard") ||
        p.name.toLowerCase().includes("express");

      let countryValue = "";
      if (p.fieldValues && p.fieldValues.length > 0) {
        const countryFv = p.fieldValues.find(
          (fv) =>
            fv.field?.slug?.toLowerCase() === "country" ||
            fv.field?.name?.toLowerCase() === "country"
        );
        if (countryFv?.value) {
          countryValue = countryFv.value.trim();
        }
      }

      let displayName = p.name.toUpperCase();
      if (isCC) {
        if (countryValue) {
          displayName = `${countryValue.toUpperCase()} ${p.name.toUpperCase()} CVV`;
        } else if (!displayName.includes("CVV")) {
          displayName = `${displayName} CVV`;
        }
        if (!image || image === "/placeholder.svg") {
          image = "/images/cards/cards-deck.jpg";
        }
      }

      return {
        id: p.id,
        name: p.name,
        displayName: displayName.trim(),
        slug: p.slug,
        price: p.salePrice ?? p.price ?? 0,
        image,
        stars: 5,
      };
    });

    return NextResponse.json(
      { products: formatted },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("[social-proof API error]:", error);
    return NextResponse.json({ products: FALLBACK_PRODUCTS });
  }
}
