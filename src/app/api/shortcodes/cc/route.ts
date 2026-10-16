import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;
    const q = searchParams.get("q")?.trim() || "";
    const country = searchParams.get("country")?.trim() || "";
    const sort = searchParams.get("sort") || "default";

    // 1. Locate CC category
    const ccCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: { equals: "cc", mode: "insensitive" } },
          { name: { equals: "CC", mode: "insensitive" } },
        ],
        isActive: true,
      },
    });

    if (!ccCategory) {
      return NextResponse.json({ error: "CC category not found" }, { status: 404 });
    }

    // 2. Build WHERE query
    const where: any = {
      categoryId: ccCategory.id,
      status: "PUBLISHED",
    };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { shortDesc: { contains: q, mode: "insensitive" } },
        {
          fieldValues: {
            some: {
              value: { contains: q, mode: "insensitive" },
            },
          },
        },
      ];
    }

    // Filter by country if specified
    if (country) {
      where.fieldValues = {
        some: {
          field: {
            slug: { in: ["country", "Country"] },
          },
          value: { contains: country, mode: "insensitive" },
        },
      };
    }

    // 3. Sorting
    let orderBy: any = { sortOrder: "asc" };
    if (sort === "price-asc") {
      orderBy = { price: "asc" };
    } else if (sort === "price-desc") {
      orderBy = { price: "desc" };
    } else if (sort === "newest") {
      orderBy = { createdAt: "desc" };
    }

    // 4. Query total count and products
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          fieldValues: {
            include: {
              field: true,
            },
          },
          reviews: {
            where: { status: "APPROVED" },
            select: { rating: true },
          },
        },
      }),
    ]);

    // 5. Query distinct countries in the CC category for dropdown filter
    const countryField = await prisma.fieldDefinition.findFirst({
      where: { slug: { in: ["country", "Country"] } },
    });

    let countries: string[] = [];
    if (countryField) {
      const countryValues = await prisma.productFieldValue.findMany({
        where: {
          fieldId: countryField.id,
          product: {
            categoryId: ccCategory.id,
            status: "PUBLISHED",
          },
        },
        select: { value: true },
        distinct: ["value"],
      });

      countries = countryValues
        .map((v) => v.value.trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
    }

    return NextResponse.json({
      success: true,
      category: {
        id: ccCategory.id,
        name: ccCategory.name,
        slug: ccCategory.slug,
      },
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      countries,
    });
  } catch (error: any) {
    console.error("Error in CC shortcode API:", error);
    return NextResponse.json(
      { error: "Failed to fetch CC products", details: error.message },
      { status: 500 }
    );
  }
}
