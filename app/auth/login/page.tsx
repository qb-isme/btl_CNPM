"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Lock, ShieldAlert, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 font-sans text-slate-900">
      <Link
        href="/"
        className="fixed left-6 top-6 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-[#0284C7]"
      >
        <ArrowLeft size={22} />
      </Link>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-200/80 lg:grid-cols-[0.85fr_1fr]">
          <section className="hidden bg-[#075CA8] p-10 text-white lg:block">
            <div className="mb-10 flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
                <img src="/bk-logo.png" alt="BK TP.HCM" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-100">
                  BK Parking
                </p>
                <p className="mt-1 text-sm text-sky-100/80">Smart Solution</p>
              </div>
            </div>

            <h1 className="text-4xl font-black uppercase leading-tight">
              Hệ thống
              <br />
              quản trị bãi xe
            </h1>
            <p className="mt-5 text-sm leading-7 text-sky-100/90">
              Đăng nhập để truy cập dashboard, lịch sử giao dịch, thanh toán và các chức năng vận hành.
            </p>
          </section>

          <section className="p-8 sm:p-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-[#0284C7]">
                <ShieldAlert size={30} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">BK-Parking Login</h2>
              <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                Hệ thống quản trị
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="ml-1 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Tài khoản MSSV
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    required
                    type="text"
                    className="w-full rounded-2xl border border-slate-200 py-4 pl-12 pr-4 outline-none transition focus:border-[#0284C7] focus:ring-4 focus:ring-sky-100"
                    placeholder="24xxxxx"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    required
                    type="password"
                    className="w-full rounded-2xl border border-slate-200 py-4 pl-12 pr-4 outline-none transition focus:border-[#0284C7] focus:ring-4 focus:ring-sky-100"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0284C7] py-4 font-extrabold text-white shadow-lg shadow-sky-100 transition hover:bg-[#075CA8] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Đang xác thực..." : "Đăng nhập ngay"}
                {!loading && <ArrowRight size={19} className="transition-transform group-hover:translate-x-1" />}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
