import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CategoryClient from "./CategoryClient";
import CCCategoryTemplate from "./CCCategoryTemplate";
import { shuffleHourly } from "@/lib/utils/shuffle";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const category = await prisma.category.findUnique({
    where: { slug: resolvedParams.slug }
  });

  if (!category) {
    const blogCategory = await prisma.blogCategory.findUnique({
      where: { slug: resolvedParams.slug }
    });
    if (blogCategory) {
      return {
        title: blogCategory.seoTitle || `${blogCategory.name} News & Guides | The Valid Market`,
        description: blogCategory.seoDescription || blogCategory.description || `Browse ${blogCategory.name} articles and guides on The Valid Market.`,
        alternates: {
          canonical: `/news?category=${blogCategory.slug}`,
        },
      };
    }
    return { title: "Category Not Found" };
  }

  return {
    title: category.seoTitle || `${category.name} | The Valid Market`,
    description: category.seoDescription || category.description || `Browse premium ${category.name} products on The Valid Market.`,
    alternates: {
      canonical: `/category/${category.slug}`,
    },
    openGraph: {
      title: category.seoTitle || category.name,
      description: category.seoDescription || category.description || "",
      images: category.image ? [category.image] : [],
    }
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; q?: string; sort?: string; country?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;

  let category = await prisma.category.findUnique({
    where: { slug: resolvedParams.slug, isActive: true }
  });

  if (!category) {
    category = await prisma.category.findFirst({
      where: {
        slug: { in: [resolvedParams.slug, resolvedParams.slug.toLowerCase(), resolvedParams.slug.toUpperCase()] },
        isActive: true
      }
    });
  }

  // Backwards compatibility for old bookmarks linking to 'bb'
  if (!category && resolvedParams.slug.toLowerCase() === "bb") {
    category = await prisma.category.findFirst({
      where: { slug: { in: ["cc", "CC"] }, isActive: true }
    });
  }

  if (!category) {
    const blogCategory = await prisma.blogCategory.findUnique({
      where: { slug: resolvedParams.slug }
    });
    if (blogCategory) {
      redirect(`/news?category=${blogCategory.slug}`);
    }
    return notFound();
  }

  // ── CC & IB SPECIAL TEMPLATE ────────────────────────────────────────────────────
  if (category.displayMode === "SPECIAL_CC" || category.slug.toLowerCase() === "cc" || category.slug.toLowerCase() === "ib" || category.displayMode === "SPECIAL_BB") {
    const page = Math.max(1, parseInt(resolvedSearch.page || "1"));
    const limit = category.productsPerPage || 20;
    const skip = (page - 1) * limit;
    const q = resolvedSearch.q?.trim() || "";
    const sort = resolvedSearch.sort || "default";
    const countryFilter = resolvedSearch.country?.trim() || "";

    // Build WHERE clause
    const whereClause: any = {
      categoryId: category.id,
      status: "PUBLISHED",
    };
    if (q) {
      whereClause.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
        { shortDesc: { contains: q } },
      ];
    }

    // Country filter requires searching in fieldValues
    let productIdsForCountry: string[] | null = null;
    if (countryFilter) {
      const countryField = await prisma.fieldDefinition.findFirst({
        where: { slug: { in: ["country", "Country"] } }
      });
      if (countryField) {
        const matchingValues = await prisma.productFieldValue.findMany({
          where: { fieldId: countryField.id, value: { contains: countryFilter } },
          select: { productId: true }
        });
        productIdsForCountry = matchingValues.map(v => v.productId);
        whereClause.id = { in: productIdsForCountry };
      }
    }

    // Build ORDER BY — worth_asc/worth_desc sorted in memory post-fetch
    let orderBy: any = { sortOrder: "asc" };
    if (sort === "newest") orderBy = { createdAt: "desc" };
    if (sort === "price_asc") orderBy = { price: "asc" };
    if (sort === "price_desc") orderBy = { price: "desc" };
    if (sort === "country_asc") orderBy = { name: "asc" }; // approximate — sorted post-fetch
    // worth_asc / worth_desc → fetch all, sort, then paginate

    const isWorthSort = sort === "worth_asc" || sort === "worth_desc";
    const isDefaultSort = !sort || sort === "default";
    const needFetchAll = isWorthSort || isDefaultSort;

    // ── Parallel queries ───────────────────────────────────────────────────
    const [
      productsRaw,
      totalCount,
      allPublishedProducts,
      categories,
    ] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: true,
          fieldValues: { include: { field: true } },
          reviews: { where: { status: "APPROVED" }, select: { rating: true } },
        },
        orderBy: needFetchAll ? { createdAt: "desc" } : orderBy,
        // If worth sort or default hourly shuffle, fetch all to sort/shuffle in memory; otherwise paginate
        skip: needFetchAll ? 0 : skip,
        take: needFetchAll ? 1000 : limit,
      }),
      prisma.product.count({ where: whereClause }),
      // For stats — fetch minimal data from ALL published CC products
      prisma.product.findMany({
        where: { categoryId: category.id, status: "PUBLISHED" },
        select: { price: true, salePrice: true, fieldValues: { include: { field: true } } },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    // ── Default Hourly Shuffle or Worth sort ─────────────────────────────────
    let products = productsRaw;
    if (isDefaultSort) {
      // Deterministically shuffle products every 60 minutes
      products = shuffleHourly(productsRaw);
      products = products.slice(skip, skip + limit);
    } else if (isWorthSort) {
      products = [...productsRaw].sort((a: any, b: any) => {
        const wa = parseFloat(a.fieldValues?.find((fv: any) => ["worth", "balance"].includes(fv.field?.slug?.toLowerCase()) || ["worth", "balance"].includes(fv.field?.name?.toLowerCase()))?.value || "0") || 0;
        const wb = parseFloat(b.fieldValues?.find((fv: any) => ["worth", "balance"].includes(fv.field?.slug?.toLowerCase()) || ["worth", "balance"].includes(fv.field?.name?.toLowerCase()))?.value || "0") || 0;
        return sort === "worth_asc" ? wa - wb : wb - wa;
      });
      // Manual paginate after sort
      products = products.slice(skip, skip + limit);
    }

    // ── Country sort ───────────────────────────────────────────────────────
    if (sort === "country_asc") {
      products = [...products].sort((a: any, b: any) => {
        const ca = a.fieldValues?.find((fv: any) => fv.field?.slug?.toLowerCase() === "country" || fv.field?.name?.toLowerCase() === "country")?.value || "";
        const cb = b.fieldValues?.find((fv: any) => fv.field?.slug?.toLowerCase() === "country" || fv.field?.name?.toLowerCase() === "country")?.value || "";
        return ca.localeCompare(cb);
      });
    }

    // ── Compute real stats ─────────────────────────────────────────────────
    const allWorthValues: number[] = [];
    const allCountries: Set<string> = new Set();
    let priceSum = 0;
    let priceCount = 0;

    for (const p of allPublishedProducts) {
      const price = p.salePrice ?? p.price;
      if (price > 0) { priceSum += price; priceCount++; }
      for (const fv of p.fieldValues) {
        const fieldName = fv.field?.name?.toLowerCase() || "";
        const fieldSlug = fv.field?.slug?.toLowerCase() || "";
        if (fieldName === "country" || fieldSlug === "country") {
          if (fv.value?.trim()) allCountries.add(fv.value.trim());
        }
        if (fieldName === "worth" || fieldSlug === "worth" || fieldName === "balance" || fieldSlug === "balance") {
          const n = parseFloat(fv.value || "0");
          if (!isNaN(n) && n > 0) allWorthValues.push(n);
        }
      }
    }

    // Unique, sorted country list
    const countries = Array.from(allCountries).sort();

    const stats = {
      productCount: totalCount,
      countryCount: countries.length,
      avgPrice: priceCount > 0 ? priceSum / priceCount : 0,
      maxWorth: allWorthValues.length > 0 ? Math.max(...allWorthValues) : 0,
    };

    return (
      <CCCategoryTemplate
        category={category}
        categories={categories}
        products={products}
        total={totalCount}
        page={page}
        limit={limit}
        searchQuery={q}
        currentSort={sort}
        countryFilter={countryFilter}
        stats={stats}
        countries={countries}
      />
    );
  }

  // ── DEFAULT CATEGORY TEMPLATE ──────────────────────────────────────────────
  const page = parseInt(resolvedSearch.page || "1");
  const limit = category.productsPerPage || 20;
  const skip = (page - 1) * limit;
  const q = resolvedSearch.q?.trim();
  const sort = resolvedSearch.sort || "default";

  const whereClause: any = {
    categoryId: category.id,
    status: "PUBLISHED"
  };

  if (q) {
    whereClause.OR = [
      { name: { contains: q } },
      { sku: { contains: q } },
      { shortDesc: { contains: q } }
    ];
  }

  let orderBy: any = { sortOrder: "asc" };
  if (sort === "name") orderBy = { name: "asc" };
  if (sort === "price_asc") orderBy = { price: "asc" };
  if (sort === "price_desc") orderBy = { price: "desc" };
  if (sort === "newest") orderBy = { createdAt: "desc" };

  const [productsData, total, categories] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        fieldValues: {
          include: { field: true }
        }
      },
      orderBy: orderBy,
      skip,
      take: limit
    }),
    prisma.product.count({ where: whereClause }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" }
    })
  ]);

  return (
    <CategoryClient
      category={category}
      categories={categories}
      products={productsData}
      total={total}
      page={page}
      limit={limit}
      searchQuery={q || ""}
      currentSort={sort}
    />
  );
}
