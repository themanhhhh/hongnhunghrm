import { cn } from "@/lib/utils";

export function Badge({ className, children, tone = "slate" }: { className?: string; children: React.ReactNode; tone?: "slate" | "teal" | "amber" | "rose" | "violet" | "blue" }) {
  const tones = { slate: "bg-slate-100 text-slate-600", teal: "bg-teal-50 text-teal-700", amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-700", violet: "bg-violet-50 text-violet-700", blue: "bg-sky-50 text-sky-700" };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold", tones[tone], className)}>{children}</span>;
}
