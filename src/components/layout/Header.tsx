import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getMenu } from "@/lib/data/menus";
import HeaderClient from "./HeaderClient";

export async function Header() {
  const session = await getServerSession(authOptions);
  
  // Fetch primary navigation menu
  const menuData = await getMenu("HEADER_MAIN");
  const menuItems = menuData?.items || [];

  let walletBalance = null;
  if (session?.user?.id) {
    const { getWalletBalance } = await import("@/lib/wallet");
    walletBalance = await getWalletBalance(session.user.id);
    
    // Fetch accountId to display in dropdown
    const { prisma } = await import("@/lib/prisma");
    const userDb = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { accountId: true }
    });
    if (userDb?.accountId) {
      (session.user as any).accountId = userDb.accountId;
    }
  }

  return (
    <HeaderClient session={session} menuItems={menuItems} walletBalance={walletBalance} />
  );
}
