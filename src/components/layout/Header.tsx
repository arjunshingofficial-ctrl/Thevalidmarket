import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getMenu } from "@/lib/data/menus";
import HeaderClient from "./HeaderClient";

export async function Header() {
  // Fetch primary navigation menu & session concurrently
  const [session, menuData] = await Promise.all([
    getServerSession(authOptions),
    getMenu("HEADER_MAIN")
  ]);

  const menuItems = menuData?.items || [];

  let walletBalance = null;
  if (session?.user?.id) {
    const { getWalletBalance } = await import("@/lib/wallet");
    const { prisma } = await import("@/lib/prisma");

    // Fetch wallet and user details concurrently
    const [balanceResult, userDb] = await Promise.all([
      getWalletBalance(session.user.id),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { accountId: true }
      })
    ]);

    walletBalance = balanceResult;
    
    if (userDb?.accountId) {
      (session.user as any).accountId = userDb.accountId;
    }
  }

  return (
    <HeaderClient session={session} menuItems={menuItems} walletBalance={walletBalance} />
  );
}
