"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_approved")
      .eq("id", data.user.id)
      .single();

    if (!profile?.is_approved) {
      await supabase.auth.signOut();
      setError("บัญชีของคุณยังรอการอนุมัติจากผู้ดูแลระบบ");
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(signUpError.message === "User already registered" ? "อีเมลนี้ถูกใช้งานแล้ว" : signUpError.message);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
      await supabase.auth.signOut();
    }

    setSuccess("สมัครสมาชิกสำเร็จ! กรุณารอผู้ดูแลระบบอนุมัติบัญชีของคุณก่อนเข้าใช้งาน");
    setLoading(false);
    setEmail("");
    setPassword("");
    setFullName("");
  }

  const Logo = () => (
    <div className="text-center mb-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/oranit-logo.svg" alt="ORANIT" className="w-16 h-16 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-800">แบบฟอร์มต่างๆ</h1>
      <p className="text-gray-500 text-sm mt-1">บริษัท กระเบื้องโอฬาร จำกัด</p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md">
        <Logo />

        <div className="flex rounded-lg border border-gray-200 mb-6 overflow-hidden">
          <button
            className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "login" ? "bg-amber-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
            onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
          >
            เข้าสู่ระบบ
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "signup" ? "bg-amber-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
            onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
          >
            สมัครสมาชิก
          </button>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="••••••••" />
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium rounded-lg py-2.5 text-sm transition-colors">
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="ชื่อ นามสกุล" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="อย่างน้อย 6 ตัวอักษร" />
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">{success}</div>}
            <button type="submit" disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium rounded-lg py-2.5 text-sm transition-colors">
              {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
