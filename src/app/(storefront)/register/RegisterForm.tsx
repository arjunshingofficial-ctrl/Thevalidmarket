"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Terminal, Zap } from "lucide-react";

export function RegisterForm({ telegramUrl }: { telegramUrl: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const callbackUrl = searchParams.get("callbackUrl");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: refCode
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          referralCode: formData.referralCode
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Store first-time welcome flag for Telegram popup
      try {
        localStorage.setItem("tvm_pending_telegram_welcome", "true");
        localStorage.removeItem("tvm_telegram_welcome_dismissed");
      } catch (e) {}

      // Automatically log the user in after registration
      const signInRes = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password
      });

      if (signInRes?.error) {
        router.push("/login?registered=true");
      } else {
        router.push("/?welcome=telegram");
        router.refresh();
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] w-full">
      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12 font-mono selection:bg-green-900 selection:text-green-400">
        <div className="w-full max-w-md bg-black/90 backdrop-blur-md border border-green-500/30 rounded-lg overflow-hidden shadow-[0_0_50px_-12px_rgba(0,255,0,0.2)]">
          
          {/* Terminal Header */}
          <div className="bg-green-900/20 border-b border-green-500/30 px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>
            <div className="ml-4 text-green-500/50 text-xs flex items-center gap-2">
              <Terminal className="w-3 h-3" /> sys_register.exe
            </div>
          </div>

          <div className="p-8">
            <div className="space-y-2 text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-green-400">CREATE ACCOUNT</h1>
              <p className="text-xs text-green-500/60 uppercase tracking-widest">
                Initialize new instance on secure server
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded border border-red-500/50 bg-red-500/10 p-3 text-xs text-red-400 text-center">
                  [ERROR]: {error}
                </div>
              )}
              
              <div className="space-y-4 text-green-400">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-green-500/80">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="flex h-10 w-full rounded border border-green-500/30 bg-black/50 px-3 py-2 text-sm text-green-400 placeholder:text-green-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500 transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-green-500/80">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="flex h-10 w-full rounded border border-green-500/30 bg-black/50 px-3 py-2 text-sm text-green-400 placeholder:text-green-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500 transition-colors"
                    placeholder="m@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-green-500/80">Password</label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="flex h-10 w-full rounded border border-green-500/30 bg-black/50 px-3 py-2 text-sm text-green-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest text-green-500/80">Confirm Password</label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="flex h-10 w-full rounded border border-green-500/30 bg-black/50 px-3 py-2 text-sm text-green-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-green-500/20 mt-4">
                  <label htmlFor="referralCode" className="text-xs font-bold uppercase tracking-widest text-green-500/80">Referral Code (Optional)</label>
                  <input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    value={formData.referralCode}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded border border-green-500/30 bg-black/50 px-3 py-2 text-sm text-green-400 placeholder:text-green-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500 transition-colors"
                    placeholder="Enter code"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded bg-green-500/10 px-4 py-3 text-sm font-bold text-green-400 border border-green-500/50 transition-all hover:bg-green-500 hover:text-black hover:shadow-[0_0_20px_rgba(0,255,0,0.4)] disabled:opacity-50 disabled:pointer-events-none"
              >
                <Zap className="w-4 h-4" />
                {loading ? "INITIALIZING..." : "CREATE ACCOUNT"}
                <div className="absolute inset-0 h-full w-0 bg-green-400/20 transition-all duration-300 ease-out group-hover:w-full" />
              </button>
            </form>

            <div className="text-center text-xs mt-6 text-green-500/60 uppercase">
              Already have an instance?{" "}
              <Link href="/login" className="font-bold text-green-400 hover:underline hover:text-green-300">
                Sign In
              </Link>
            </div>

            {telegramUrl && (
              <div className="mt-8 pt-6 border-t border-green-500/20 text-center">
                <p className="text-[10px] uppercase tracking-widest text-green-500/50 mb-3">Secure Comms Channel</p>
                <a 
                  href={telegramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded bg-blue-900/30 border border-blue-500/50 px-4 py-2 text-xs font-bold text-blue-400 shadow transition-all hover:bg-blue-500 hover:text-black hover:shadow-[0_0_15px_rgba(0,136,204,0.4)]"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.26-5.61 3.71-.53.36-1.01.54-1.44.53-.48-.01-1.39-.27-2.07-.49-.84-.28-1.51-.42-1.45-.89.03-.25.38-.51 1.07-.78 4.2-1.82 7-3.03 8.4-3.61 4-.1.66 1.76-.01 2.19-.11z"/></svg>
                  JOIN TELEGRAM
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
