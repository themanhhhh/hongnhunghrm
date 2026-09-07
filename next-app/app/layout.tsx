import type { Metadata } from "next";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

export const metadata: Metadata = { title: "BRAVO HRM | People operations", description: "Cổng vận hành nhân sự BRAVO" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body><QueryProvider>{children}</QueryProvider></body></html>;
}
