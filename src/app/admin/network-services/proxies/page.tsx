import { prisma } from "@/lib/prisma";
import ProxiesSettingsClient from "./ProxiesSettingsClient";

export const dynamic = "force-dynamic";

export default async function ProxyLicensesPage() {
  // Fetch only the Socks 5 products we created
  const proxyProducts = await prisma.product.findMany({
    where: {
      type: "SOFTWARE",
      slug: { in: ["socks-5-android", "socks-5-windows", "socks-5-ios"] }
    }
  });

  // Map products to their existing static licenses
  const initialData = proxyProducts.map(p => {
    const meta = p.metadata ? JSON.parse(p.metadata as string) : {};
    return {
      id: p.id,
      name: p.name,
      platform: meta.platform || p.name,
      staticLicense: meta.staticLicense || ""
    };
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Static Proxy Licenses</h1>
        <p className="text-slate-500 mt-1">Configure exactly which proxy credentials get assigned to users when they purchase a proxy product.</p>
      </div>

      <ProxiesSettingsClient initialData={initialData} />
    </div>
  );
}
