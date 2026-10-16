import { Metadata } from "next";
import CCProductsShortcode from "@/components/shortcodes/CCProductsShortcode";

export const metadata: Metadata = {
  title: "CC Products Embed | The Valid Market",
  description: "Live CC products feed from The Valid Market",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CCEmbedPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-2 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <CCProductsShortcode />
      </div>
    </div>
  );
}
