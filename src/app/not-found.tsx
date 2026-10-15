import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import QuickCheckoutToast from "@/components/cart/QuickCheckoutToast";
import NotFoundView from "@/components/layout/NotFoundView";

export const metadata: Metadata = {
  title: "404 - Page Not Found | The Valid Market",
  description: "The page or product you were looking for could not be found on The Valid Market.",
};

export default function RootNotFound() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <NotFoundView />
      </main>
      <Footer />
      <QuickCheckoutToast />
    </>
  );
}
