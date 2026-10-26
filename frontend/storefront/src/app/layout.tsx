import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { getSession } from "@/lib/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAQS Inventory",
  description: "Inventory admin for products, measurements, and stock.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <html lang="en">
      <body>
        <Providers accessToken={session?.accessToken ?? null}>{children}</Providers>
      </body>
    </html>
  );
}
