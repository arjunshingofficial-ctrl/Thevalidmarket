export function normalizeImageUrl(urlOrPath: string | null | undefined): string {
  if (!urlOrPath) return "";

  if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://") || urlOrPath.startsWith("data:")) {
    return urlOrPath;
  }

  let key = urlOrPath.startsWith("/") ? urlOrPath.slice(1) : urlOrPath;
  if (key.startsWith("uploads/")) {
    key = `public/${key}`;
  }

  const endpoint = process.env.NEXT_PUBLIC_STORAGE_ENDPOINT || process.env.STORAGE_ENDPOINT || "";
  const bucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || "";

  if (!endpoint) {
    return `/${key}`;
  }

  const cleanEndpoint = endpoint.replace(/\/$/, "");

  if (cleanEndpoint.includes(".supabase.co") && cleanEndpoint.endsWith("/storage/v1/s3")) {
    const supabasePublicEndpoint = cleanEndpoint.replace("/storage/v1/s3", "/storage/v1/object/public");
    return `${supabasePublicEndpoint}/${bucket}/${key}`;
  }

  return `${cleanEndpoint}/${bucket}/${key}`;
}
