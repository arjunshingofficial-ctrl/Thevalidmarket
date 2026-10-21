import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import QuickCheckoutToast from "@/components/cart/QuickCheckoutToast";
import RecentSalesToast from "@/components/common/RecentSalesToast";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <QuickCheckoutToast />
      <RecentSalesToast />
    </>
  );
}

