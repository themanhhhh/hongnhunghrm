"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  KeyRound,
  Network,
  Plus,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

const cards = [
  {
    title: "Tài khoản & phân quyền",
    desc: "Vai trò, trạng thái và phạm vi truy cập",
    icon: KeyRound,
    count: "24 tài khoản",
    tone: "violet" as const,
  },
  {
    title: "Sơ đồ tổ chức",
    desc: "Bộ phận, cấp trên và người phụ trách",
    icon: Network,
    count: "14 bộ phận",
    tone: "teal" as const,
  },
  {
    title: "Vị trí công việc",
    desc: "Định biên, thang bậc và lộ trình HĐLĐ",
    icon: UsersRound,
    count: "38 vị trí",
    tone: "blue" as const,
  },
  {
    title: "Loại hợp đồng",
    desc: "Thời hạn, thử việc và điều kiện áp dụng",
    icon: ShieldCheck,
    count: "6 loại HĐLĐ",
    tone: "amber" as const,
  },
];

export default function AdminPage() {
  const { data } = useQuery({
    queryKey: ["admin-summary"],
    queryFn: api.admin,
  });
  const liveCards = cards.map((card) => ({
    ...card,
    count: card.title.includes("Tài khoản")
      ? `${data?.users ?? 24} tài khoản`
      : card.title.includes("Sơ đồ")
        ? `${data?.departments ?? 14} bộ phận`
        : card.title.includes("Vị trí")
          ? `${data?.positions ?? 38} vị trí`
          : `${data?.contractTypes ?? 6} loại HĐLĐ`,
  }));
  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-violet-700">
            SYSTEM GOVERNANCE
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">
            Quản trị hệ thống
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Kiểm soát danh mục dùng chung, tài khoản và cấu trúc tổ chức trong
            một không gian quản trị rõ ràng.
          </p>
        </div>
        <Button>
          <Plus size={16} /> Tạo tài khoản
        </Button>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {liveCards.map(({ title, desc, icon: Icon, count, tone }) => (
          <Card
            key={title}
            className="group cursor-pointer transition hover:-translate-y-0.5 hover:border-teal-300"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-teal-50 group-hover:text-teal-700">
                  <Icon size={20} />
                </div>
                <Badge tone={tone}>{count}</Badge>
              </div>
              <CardTitle className="mt-5">{title}</CardTitle>
              <p className="mt-1 text-sm text-slate-500">{desc}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs font-bold text-teal-700">
                Mở danh mục <span>→</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Hoạt động hệ thống gần đây</CardTitle>
          {/* <p className="mt-1 text-xs text-slate-400">
            Nhật ký thay đổi được ghi nhận theo người dùng và thời gian
          </p> */}
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            "Cập nhật định biên Phòng Cloud và Hạ tầng",
            "Tạo tài khoản cho Lê Minh Quân",
            "Thêm bước lộ trình HĐLĐ cho vị trí Chuyên viên ERP",
            "Khóa tài khoản không hoạt động",
          ].map((item, i) => (
            <div
              key={item}
              className="flex items-center justify-between rounded-xl px-3 py-3 text-sm hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-7 place-items-center rounded-full bg-teal-50 text-teal-700">
                  <Building2 size={14} />
                </div>
                <span className="font-medium text-slate-700">{item}</span>
              </div>
              <span className="text-xs text-slate-400">{i + 1} giờ trước</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
