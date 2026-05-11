"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  AlertCircle,
  Car,
  Headphones,
  Lock,
  ShieldCheck,
  User,
  WalletCards,
} from "lucide-react";

type Credentials = {
  username: string;
  password: string;
};

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<Credentials>({
    username: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/map");
      } else {
        setError(data.message || "Sai tài khoản hoặc mật khẩu!");
      }
    } catch {
      setError("Lỗi kết nối: Hãy đảm bảo bạn đã chạy 'node server/index.js'");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof Credentials, value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_0.95fr]">
        <section className="bg-[#0B63B5] px-6 py-10 text-white sm:px-10 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-12">
          <div>
            <div className="mb-10 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
                <img src="/bk-logo.png" alt="BK TP.HCM" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-100">
                  Trường Đại học Bách Khoa - Đại học Quốc gia TP.HCM
                </p>
              </div>
            </div>

            <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-cyan-200">
              Smart Parking Solution
            </p>
            <h1 className="text-4xl font-black uppercase leading-tight sm:text-5xl xl:text-6xl">
              BK Smart
              <br />
              Parking
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-blue-50/90">
              Hệ thống quản lý bãi đỗ xe thông minh, hỗ trợ định danh nội bộ,
              giám sát thời gian thực và thanh toán trực tuyến BKPay.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:mt-14">
            <FeatureCard
              icon={<ShieldCheck size={22} />}
              title="Bảo mật"
              description="Định danh tập trung"
            />
            <FeatureCard
              icon={<Car size={22} />}
              title="IoT"
              description="Theo dõi bãi xe"
            />
            <FeatureCard
              icon={<WalletCards size={22} />}
              title="BKPay"
              description="Thanh toán tiện lợi"
            />
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-5 py-10 sm:px-8">
          <div className="w-full max-w-[500px] rounded-[28px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70 sm:p-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-[#0284C7]">
                <img src="/bk-logo.png" alt="BK TP.HCM" className="h-full w-full object-contain" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Chào mừng trở lại
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Vui lòng đăng nhập để truy cập hệ thống.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  <AlertCircle size={20} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="ml-1 text-sm font-bold text-slate-800">
                  Tài khoản (MSSV)
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={21} />
                  <input
                    required
                    type="text"
                    placeholder="VD: 2410297"
                    value={credentials.username}
                    onChange={(e) => updateField("username", e.target.value)}
                    className={`w-full rounded-2xl border bg-white py-4 pl-12 pr-4 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0284C7] focus:ring-4 focus:ring-sky-100 ${
                      error ? "border-red-300 bg-red-50/40" : "border-slate-200"
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-sm font-bold text-slate-800">Mật khẩu</label>
                  <a href="#" className="text-xs font-bold text-[#0284C7] hover:underline">
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={21} />
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    className={`w-full rounded-2xl border bg-white py-4 pl-12 pr-4 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0284C7] focus:ring-4 focus:ring-sky-100 ${
                      error ? "border-red-300 bg-red-50/40" : "border-slate-200"
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0F172A] px-5 py-4 text-lg font-extrabold text-white transition-all hover:bg-[#0284C7] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Đăng nhập hệ thống
                    <ArrowRight size={21} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-6 text-center">
              <p className="text-sm text-slate-500">Bạn gặp sự cố đăng nhập?</p>
              <button className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-extrabold text-[#075CA8] hover:text-[#0284C7]">
                <Headphones size={18} />
                Liên hệ Ban quản lý bãi xe
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-cyan-100">
        {icon}
      </div>
      <p className="font-extrabold text-white">{title}</p>
      <p className="mt-1 text-xs font-medium text-sky-100/80">{description}</p>
    </div>
  );
}
