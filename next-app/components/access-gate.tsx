"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { canAccess, type Resource, type Session } from "@/lib/permissions";
import { getStoredSession, subscribeToSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AccessGate({ resource, children }: { resource: Resource; children: React.ReactNode }) {
  const router = useRouter();
  const session = useSyncExternalStore(subscribeToSession, getStoredSession, () => null) as Session | null;
  if (!session) return <div className="grid min-h-[500px] place-items-center text-sm text-slate-400">Đang kiểm tra quyền truy cập...</div>;
  if (!canAccess(session, resource)) return <Card className="mx-auto max-w-xl p-8 text-center"><CardContent><div className="font-display text-xl font-bold text-slate-950">Bạn không có quyền truy cập</div><p className="mt-2 text-sm text-slate-500">Vai trò hiện tại không được phép mở khu vực này.</p><Button className="mt-5" onClick={() => router.push("/dashboard")}>Về tổng quan</Button></CardContent></Card>;
  return children;
}
