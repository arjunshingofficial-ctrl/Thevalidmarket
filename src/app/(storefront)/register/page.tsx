import { Suspense } from "react";
import { RegisterForm } from "./RegisterForm";
import { Metadata } from "next";
import { getSupportSettings } from "@/lib/settings/support";

export const metadata: Metadata = {
  title: "Create Account | The Valid Market",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function RegisterPage() {
  const { telegramUrl } = await getSupportSettings();

  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">Loading...</div>}>
      <RegisterForm telegramUrl={telegramUrl} />
    </Suspense>
  );
}
