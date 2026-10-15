import { Metadata } from "next";
import NotFoundView from "@/components/layout/NotFoundView";

export const metadata: Metadata = {
  title: "404 - Page Not Found | The Valid Market",
  description: "The page or product you were looking for could not be found on The Valid Market.",
};

export default function StorefrontNotFound() {
  return <NotFoundView />;
}
