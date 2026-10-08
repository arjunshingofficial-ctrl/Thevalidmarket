export function normalizeImageUrl(urlOrPath: string | null | undefined): string {
  if (!urlOrPath) return "";

  if (urlOrPath.startsWith("data:") || urlOrPath.startsWith("blob:")) {
    return urlOrPath;
  }

  const isHttp = urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://");

  if (isHttp) {
    if (!urlOrPath.includes(".supabase.co")) {
      return urlOrPath;
    }
    try {
      const urlObj = new URL(urlOrPath);
      if (urlObj.hostname.endsWith(".storage.supabase.co")) {
        urlObj.hostname = urlObj.hostname.replace(".storage.supabase.co", ".supabase.co");
      }
      if (urlObj.pathname.startsWith("/storage/v1/s3/")) {
        urlObj.pathname = urlObj.pathname.replace("/storage/v1/s3/", "/storage/v1/object/public/");
      }
      return urlObj.toString();
    } catch (e) {
      return urlOrPath;
    }
  }

  let key = urlOrPath.startsWith("/") ? urlOrPath.slice(1) : urlOrPath;
  if (key.startsWith("uploads/")) {
    key = `public/${key}`;
  }

  const endpoint = process.env.NEXT_PUBLIC_STORAGE_ENDPOINT || "";
  const bucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "";

  if (!endpoint) {
    return `/${key}`;
  }

  let baseOrigin = endpoint;
  try {
    const urlObj = new URL(endpoint);
    if (urlObj.hostname.endsWith(".storage.supabase.co")) {
      urlObj.hostname = urlObj.hostname.replace(".storage.supabase.co", ".supabase.co");
    }
    baseOrigin = urlObj.origin;
  } catch (e) {
    if (baseOrigin.includes(".storage.supabase.co")) {
      baseOrigin = baseOrigin.replace(".storage.supabase.co", ".supabase.co");
    }
    const idx = baseOrigin.indexOf("/storage");
    if (idx !== -1) {
      baseOrigin = baseOrigin.substring(0, idx);
    }
    baseOrigin = baseOrigin.replace(/\/$/, "");
  }

  return `${baseOrigin}/storage/v1/object/public/${bucket}/${key}`;
}
