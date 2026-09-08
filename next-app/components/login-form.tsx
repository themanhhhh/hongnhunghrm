"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});
type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setError("");
    const result = await api.login(values.username, values.password);
    if (!result.success || !result.session)
      return setError(
        result.message ?? "Tên đăng nhập hoặc mật khẩu không chính xác.",
      );
    router.push("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}
      <div>
          <label className="mb-1 block text-[10px] font-semibold text-slate-600">
          Tên người dùng
        </label>
        <div className="relative">
          <UserRound
            className="absolute left-3 top-2.5 text-slate-400"
            size={14}
          />
          <Input
            className="h-9 rounded-md pl-9 text-xs"
            placeholder="Nhập tên người dùng"
            {...register("username")}
          />{" "}
        </div>
        {errors.username && (
          <p className="mt-1.5 text-xs text-rose-600">
            {errors.username.message}
          </p>
        )}
      </div>
      <div>
          <label className="mb-1 block text-[10px] font-semibold text-slate-600">
          Mật khẩu
        </label>
        <div className="relative">
          <LockKeyhole
            className="absolute left-3 top-2.5 text-slate-400"
            size={14}
          />
          <Input
            className="h-9 rounded-md pl-9 pr-9 text-xs"
            type={showPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-2.5 text-slate-400"
            aria-label="Hiển thị mật khẩu"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1.5 text-xs text-rose-600">
            {errors.password.message}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <label className="flex items-center gap-1.5 text-slate-500">
          <input
            type="checkbox"
            defaultChecked
            className="size-3 rounded accent-teal-700"
          />{" "}
          Ghi nhớ đăng nhập
        </label>
        <button
          type="button"
          className="font-semibold text-teal-700 hover:text-teal-900"
        >
          Quên mật khẩu?
        </button>
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        size="default"
        className="h-9 w-full rounded-md text-xs"
      >
        {isSubmitting ? "Đang xác thực..." : "Đăng nhập"}
        <ArrowRight size={14} />
      </Button>
      {/* <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500">
        <span className="font-bold text-slate-700">Demo:</span> admin / 123456{" "}
        <button
          type="button"
          onClick={() => {
            setValue("username", "admin");
            setValue("password", "123456");
          }}
          className="ml-1 font-bold text-teal-700"
        >
          Điền tự động
        </button>
      </div> */}
    </form>
  );
}
