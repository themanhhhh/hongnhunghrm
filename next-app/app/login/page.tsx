import { Building2, CheckCircle2, LockKeyhole } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#f6f8f7] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-[#0c1d24] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-28 -top-28 size-96 rounded-full border-[60px] border-teal-300/10" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-teal-300 font-black text-[#0c1d24]">
              B
            </div>
            <div>
              <div className="font-display text-xl font-bold">
                BRAVO<span className="text-teal-300">/</span>HRM
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                People operations
              </div>
            </div>
          </div>
          <div className="mt-32 max-w-md">
            <div className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-teal-300">
              Enterprise people system
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.08] tracking-tight">
              Mỗi người giỏi hơn,{" "}
              <span className="text-teal-300">doanh nghiệp mạnh hơn.</span>
            </h1>
           
           
          </div>
        </div>
        <div className="relative flex items-center justify-between border-t border-white/10 pt-5 text-xs text-slate-500">
          <span>© 2026 BRAVO Software JSC</span>
          <span className="flex items-center gap-2">
            <LockKeyhole size={13} /> Protected workspace
          </span>
        </div>
      </section>
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[430px]">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 grid size-11 place-items-center rounded-xl bg-teal-700 font-black text-white">
              B
            </div>
            <div className="font-display text-2xl font-bold">
              BRAVO<span className="text-teal-700">/</span>HRM
            </div>
          </div>
          <div className="mb-8">
            <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
              <Building2 size={23} />
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">
              Chào mừng trở lại
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Đăng nhập để tiếp tục phiên làm việc trong Cổng Nhân sự.
            </p>
          </div>
          <LoginForm />
          <p className="mt-8 text-center text-xs text-slate-400">
            Bằng việc đăng nhập, bạn đồng ý với chính sách bảo mật nội bộ BRAVO.
          </p>
        </div>
      </section>
    </main>
  );
}
