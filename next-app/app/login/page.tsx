import { Building2 } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f4f8f7] px-4 py-8">
      <section className="w-full max-w-[360px] rounded-md border border-slate-100 bg-white p-6 shadow-[0_8px_24px_rgba(31,65,58,0.06)] sm:p-7">
        <div className="mb-5 grid size-7 place-items-center rounded-md bg-[#e8f4f1] text-[#2d6f62]">
          <Building2 size={15} />
        </div>
        <div className="mb-5">
          <h1 className="text-[17px] font-bold tracking-tight text-slate-900">
            Đăng nhập Cổng Nhân sự
          </h1>
          <p className="mt-1 text-[10px] leading-4 text-slate-400">
            Vui lòng nhập thông tin tài khoản để tiếp tục
          </p>
        </div>
        <LoginForm />
      </section>
      <p className="mt-5 text-center text-[9px] text-slate-400">
        © 2026 BRAVO ERP | Cổng Nhân sự - Software JSC
      </p>
    </main>
  );
}
