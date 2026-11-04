"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Terminal, Shield, Zap, Lock } from "lucide-react";

export default function HackerHero() {
  const { data: session } = useSession();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [typedText, setTypedText] = useState("");
  
  const userName = session?.user?.name ? session.user.name.toUpperCase() : null;
  const fullText = userName
    ? `INITIALIZING CONNECTION...\n> ACCESS GRANTED\n> OPERATOR: ${userName}\n> WELCOME TO THE VALID MARKET`
    : "INITIALIZING CONNECTION...\n> ACCESS GRANTED\n> WELCOME TO THE VALID MARKET";

  // Typing effect
  useEffect(() => {
    let i = 0;
    setTypedText("");
    const interval = setInterval(() => {
      setTypedText(fullText.substring(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [fullText]);

  // Matrix Rain Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#0f0"; // Hacker green
      ctx.font = fontSize + "px monospace";

      for (let i = 0; i < drops.length; i++) {
        const text = letters.charAt(Math.floor(Math.random() * letters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] flex items-center justify-center bg-black overflow-hidden font-mono selection:bg-green-900 selection:text-green-400">
      {/* Matrix Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-40" />

      {/* Vignette/Gradients */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_80%)]" />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center">
        
        {/* Terminal Window */}
        <div className="w-full max-w-2xl bg-black/80 backdrop-blur-md border border-green-500/30 rounded-lg overflow-hidden shadow-[0_0_50px_-12px_rgba(0,255,0,0.3)]">
          {/* Terminal Header */}
          <div className="bg-green-900/20 border-b border-green-500/30 px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>
            <div className="ml-4 text-green-500/50 text-xs flex items-center gap-2">
              <Terminal className="w-3 h-3" /> sys_terminal.exe
            </div>
          </div>
          
          {/* Terminal Body */}
          <div className="p-6 md:p-8 flex flex-col items-center text-center">
            <div className="mb-8 w-full text-left">
              <pre className="text-green-400 text-sm md:text-base whitespace-pre-wrap font-mono leading-relaxed">
                {typedText}
                <span className="animate-pulse">_</span>
              </pre>
            </div>

            {session?.user ? (
              <div className="w-full max-w-sm space-y-4">
                <Link
                  href="/store"
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded bg-green-500/10 px-4 py-3 text-sm font-bold text-green-400 border border-green-500/50 transition-all hover:bg-green-500 hover:text-black hover:shadow-[0_0_20px_rgba(0,255,0,0.4)]"
                >
                  <Zap className="w-4 h-4" />
                  ENTER STORE &amp; BROWSE MARKET
                  <div className="absolute inset-0 h-full w-0 bg-green-400/20 transition-all duration-300 ease-out group-hover:w-full" />
                </Link>
                
                <Link
                  href="/dashboard"
                  className="flex w-full items-center justify-center gap-2 rounded px-4 py-3 text-sm font-bold text-slate-400 border border-slate-700 transition-all hover:text-white hover:border-slate-500 bg-black/50"
                >
                  <Terminal className="w-4 h-4" />
                  USER DASHBOARD
                </Link>
              </div>
            ) : (
              <div className="w-full max-w-sm space-y-4">
                <Link
                  href="/login"
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded bg-green-500/10 px-4 py-3 text-sm font-bold text-green-400 border border-green-500/50 transition-all hover:bg-green-500 hover:text-black hover:shadow-[0_0_20px_rgba(0,255,0,0.4)]"
                >
                  <Lock className="w-4 h-4" />
                  LOGIN
                  <div className="absolute inset-0 h-full w-0 bg-green-400/20 transition-all duration-300 ease-out group-hover:w-full" />
                </Link>
                
                <Link
                  href="/register"
                  className="flex w-full items-center justify-center gap-2 rounded px-4 py-3 text-sm font-bold text-slate-400 border border-slate-700 transition-all hover:text-white hover:border-slate-500 bg-black/50"
                >
                  <Zap className="w-4 h-4" />
                  CREATE ACCOUNT
                </Link>
              </div>
            )}
            
            <div className="mt-8 grid grid-cols-3 gap-4 w-full border-t border-green-500/20 pt-6">
              <div className="flex flex-col items-center justify-center text-center">
                <Shield className="w-5 h-5 text-green-500/60 mb-2" />
                <span className="text-[10px] text-green-500/60 uppercase tracking-widest">Encrypted</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center">
                <Terminal className="w-5 h-5 text-green-500/60 mb-2" />
                <span className="text-[10px] text-green-500/60 uppercase tracking-widest">Root Access</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center">
                <Lock className="w-5 h-5 text-green-500/60 mb-2" />
                <span className="text-[10px] text-green-500/60 uppercase tracking-widest">Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
