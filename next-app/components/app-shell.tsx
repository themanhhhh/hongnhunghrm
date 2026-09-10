"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  CircleUserRound,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  Settings2,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { canAccess, type Resource, type Session } from "@/lib/permissions";
import { getStoredSession, subscribeToSession } from "@/lib/session";
import { workspaceTabs } from "@/lib/workspace-config";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  resource: Resource;
  subItems?: Array<{ id: string; label: string }>;
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Tổng quan",
    icon: LayoutDashboard,
    resource: "dashboard",
  },
  {
    href: "/recruitment",
    label: "Tuyển dụng",
    icon: BriefcaseBusiness,
    resource: "recruitment",
    subItems: [
      { id: "quota", label: "Định biên nhân sự" },
      { id: "requests", label: "Yêu cầu tuyển dụng" },
      { id: "candidates", label: "Hồ sơ ứng viên" },
      { id: "screenings", label: "Phiếu sơ loại" },
      { id: "schedules", label: "Lập lịch" },
      { id: "interview-evaluations", label: "Đánh giá phỏng vấn" },
      { id: "offers", label: "Offer" },
      { id: "decisions", label: "Quyết định trúng tuyển" },
    ],
  },
  {
    href: "/people",
    label: "Nhân sự",
    icon: UsersRound,
    resource: "people",
    subItems: workspaceTabs.people.map((item) => ({
      id: item.id,
      label: item.label,
    })),
  },
  {
    href: "/rewards",
    label: "Khen thưởng & kỷ luật",
    icon: Sparkles,
    resource: "rewards",
    subItems: workspaceTabs.rewards.map((item) => ({
      id: item.id,
      label: item.label,
    })),
  },
  { href: "/reports", label: "Báo cáo", icon: BarChart3, resource: "reports" },
  {
    href: "/admin",
    label: "Quản trị hệ thống",
    icon: Settings2,
    resource: "admin",
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const session = useSyncExternalStore(
    subscribeToSession,
    getStoredSession,
    () => null,
  ) as Session | null;
  const initials =
    session?.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() ?? "HR";
  useEffect(() => {
    if (!session) router.replace("/login");
  }, [router, session]);
  const visibleNav = navItems.filter((item) =>
    canAccess(session, item.resource),
  );
  const routeResource = navItems.find((item) =>
    pathname.startsWith(item.href),
  )?.resource;
  const routeDenied = routeResource && !canAccess(session, routeResource);
  const currentTab = searchParams.get("tab");
  const currentNav = navItems.find((item) => pathname.startsWith(item.href));
  const currentSubLabel = currentNav?.subItems?.find(
    (item) => item.id === currentTab,
  )?.label;

  const logout = () => {
    window.localStorage.removeItem("bravo_next_session");
    window.localStorage.removeItem("bravo_next_token");
    router.push("/login");
  };

  if (!session)
    return (
      <div className="grid min-h-screen place-items-center bg-[#f6f8f7] text-sm text-slate-400">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-slate-900">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[274px] flex-col border-r border-white/10 bg-[#0c1d24] text-white transition-all duration-300 lg:translate-x-0",
          collapsed && "lg:w-[84px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-[86px] items-center justify-between border-b border-white/10 px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={() => setMobileOpen(false)}
          >
            <div className="grid size-10 place-items-center rounded-xl bg-teal-400 font-black tracking-tighter text-[#0c1d24]">
              B
            </div>
            {!collapsed && (
              <div>
                <div className="font-display text-lg font-bold tracking-tight">
                  BRAVO<span className="text-teal-300">/</span>HRM
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  People operations
                </div>
              </div>
            )}
          </Link>
          <button
            className="text-slate-400 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {!collapsed && (
            <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Workspace
            </div>
          )}
          <nav className="space-y-1.5">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              const subItems = item.subItems?.filter(
                (subItem) =>
                  !(
                    session?.role === "Nhân viên" && item.resource === "people"
                  ) || ["employees", "leave"].includes(subItem.id),
              );
              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
                      active
                        ? "bg-teal-400 text-[#092027] shadow-lg shadow-teal-950/20"
                        : "text-slate-400 hover:bg-white/5 hover:text-white",
                      collapsed && "justify-center px-0",
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      size={18}
                      className={cn(
                        active
                          ? "text-[#092027]"
                          : "text-slate-500 group-hover:text-teal-300",
                      )}
                    />
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && active && (
                      <span className="ml-auto size-1.5 rounded-full bg-[#092027]" />
                    )}
                  </Link>
                  {!collapsed && active && subItems && (
                    <div className="ml-4 space-y-0.5 border-l border-white/10 pl-3">
                      {subItems.map((subItem) => {
                        const subActive = currentTab === subItem.id;
                        return (
                          <Link
                            key={subItem.id}
                            href={`${item.href}?tab=${subItem.id}`}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "block rounded-lg px-3 py-2 text-xs transition",
                              subActive
                                ? "bg-white/10 font-bold text-teal-300"
                                : "text-slate-500 hover:bg-white/5 hover:text-slate-200",
                            )}
                          >
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto space-y-4 p-4">
          {/* {!collapsed && (
            // <div className="rounded-2xl border border-teal-300/15 bg-teal-300/5 p-4">
            //   <div className="mb-2 flex items-center gap-2 text-teal-300">
            //     <ShieldCheck size={16} />
            //     <span className="text-xs font-bold">Không gian an toàn</span>
            //   </div>
            //   <p className="text-xs leading-5 text-slate-400">
            //     Dữ liệu được hiển thị theo vai trò và phạm vi phòng ban.
            //   </p>
            // </div>
          )} */}
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3",
              collapsed && "justify-center p-2",
            )}
          >
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-700 text-sm font-bold text-teal-300">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-xs font-bold">{session.name}</div>
                <div className="truncate text-[11px] text-slate-500">
                  {session.role}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
      <div
        className={cn(
          "transition-all duration-300 lg:pl-[274px]",
          collapsed && "lg:pl-[84px]",
        )}
      >
        <header className="sticky top-0 z-30 flex h-[86px] items-center justify-between border-b border-slate-200/80 bg-[#f6f8f7]/90 px-5 backdrop-blur-xl lg:px-9">
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Mở menu"
            >
              <Menu size={19} />
            </button>
            <button
              className="hidden rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-teal-700 lg:block"
              onClick={() => setCollapsed((v) => !v)}
              aria-label="Thu gọn menu"
            >
              {collapsed ? <Menu size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <div className="hidden text-sm font-medium text-slate-400 sm:block">
              BRAVO HRM <span className="mx-2 text-slate-300">/</span>{" "}
              <span className="text-slate-700">
                {pathname === "/dashboard"
                  ? "Tổng quan"
                  : (currentSubLabel ?? pathname.slice(1))}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              className="relative rounded-xl p-2.5 text-slate-500 hover:bg-white hover:text-teal-700"
              aria-label="Thông báo"
            >
              <Bell size={19} />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-rose-500" />
            </button>
            <div className="hidden h-7 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">
                {initials}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-800">
                  {session.name}
                </div>
                <div className="text-[11px] text-slate-400">{session.role}</div>
              </div>
              <ChevronDown
                size={15}
                className="hidden text-slate-400 sm:block"
              />
            </div>
            <button
              onClick={logout}
              className="rounded-xl p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              aria-label="Đăng xuất"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1560px] p-5 lg:p-9">
          {routeDenied ? (
            <div className="mx-auto mt-16 max-w-xl rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
              <div className="font-display text-xl font-bold text-slate-950">
                Bạn không có quyền truy cập
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Vai trò hiện tại không được phép mở khu vực này.
              </p>
              <Button
                className="mt-5"
                onClick={() => router.push("/dashboard")}
              >
                Về tổng quan
              </Button>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
