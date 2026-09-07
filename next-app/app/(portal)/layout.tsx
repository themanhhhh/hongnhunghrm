import { AppShell } from "@/components/app-shell";
import { Suspense } from "react";

export default function PortalLayout({ children }: { children: React.ReactNode }) { return <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#f6f8f7] text-sm text-slate-400">Đang tải workspace...</div>}><AppShell>{children}</AppShell></Suspense>; }
