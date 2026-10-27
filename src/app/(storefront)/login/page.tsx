import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { Metadata } from "next";
import { getSupportSettings } from "@/lib/settings/support";

export const metadata: Metadata = {
  title: "Sign In | The Valid Market",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function LoginPage() {
  const { telegramUrl } = await getSupportSettings();

  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">Loading...</div>}>
      <LoginForm telegramUrl={telegramUrl} />
    </Suspense>
  );
}
