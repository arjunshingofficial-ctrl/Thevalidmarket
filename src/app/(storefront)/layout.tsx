import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import QuickCheckoutToast from "@/components/cart/QuickCheckoutToast";
import RecentSalesToast from "@/components/common/RecentSalesToast";
import { FloatingSupportButton } from "@/components/layout/FloatingSupportButton";
import { getSupportSettings } from "@/lib/settings/support";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { telegramUrl } = await getSupportSettings();

  return (
    <>
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer telegramUrl={telegramUrl} />
      <FloatingSupportButton initialTelegramUrl={telegramUrl} />
      <QuickCheckoutToast />
      <RecentSalesToast />
    </>
  );
}

