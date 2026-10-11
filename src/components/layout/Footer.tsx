"use client";

import Link from "next/link";
import { Send, ShieldCheck, Zap, HeadphonesIcon } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-900 overflow-hidden relative">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[128px] translate-y-1/2 pointer-events-none" />

      {/* Feature Highlights (Pre-footer) */}
      <div className="border-b border-slate-800/50 relative z-10">
        <div className="container mx-auto px-4 md:px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-primary shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">Secure Checkout</h4>
                <p className="text-slate-400 text-sm mt-1 leading-relaxed">Your payments are protected with industry-leading encryption and security.</p>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-primary shadow-sm">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">Instant Delivery</h4>
                <p className="text-slate-400 text-sm mt-1 leading-relaxed">Get access to your digital purchases immediately after a successful payment.</p>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-primary shadow-sm">
                <HeadphonesIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">24/7 Support</h4>
                <p className="text-slate-400 text-sm mt-1 leading-relaxed">Our dedicated team is always online to help you with any issues or queries.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container mx-auto px-4 md:px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          
          {/* Brand & Newsletter */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2 group inline-block">
              <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                A
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white">
                Asia D Market
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Your premier destination for high-quality digital assets. Discover premium software, expert courses, essential tools, and professional services tailored to accelerate your growth.
            </p>
            
            <div className="space-y-3 pt-2">
              <h5 className="text-white font-medium text-sm">Subscribe to our newsletter</h5>
              <form className="flex gap-2 max-w-sm" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-500"
                />
                <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="text-white font-semibold text-base mb-6">Marketplace</h4>
            <ul className="space-y-3.5 text-sm">
              <li><Link href="/store" className="text-slate-400 hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">All Products</Link></li>
              <li><Link href="/store?category=software" className="text-slate-400 hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">Software & Tools</Link></li>
              <li><Link href="/store?category=courses" className="text-slate-400 hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">Courses</Link></li>
              <li><Link href="/store?category=vpn" className="text-slate-400 hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">VPN & Proxies</Link></li>
              <li><Link href="/store?category=accounts" className="text-slate-400 hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">Digital Accounts</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-base mb-6">Support & Info</h4>
            <ul className="space-y-3.5 text-sm">
              <li><Link href="/contact" className="text-slate-400 hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">Contact Us</Link></li>
              <li><Link href="/faq" className="text-slate-400 hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">Help Center (FAQ)</Link></li>
              <li><Link href="/blog" className="text-slate-400 hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">Our Blog</Link></li>
              <li><Link href="/about" className="text-slate-400 hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-base mb-6">Legal</h4>
            <ul className="space-y-3.5 text-sm">
              <li><Link href="/terms" className="text-slate-400 hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="text-slate-400 hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">Privacy Policy</Link></li>
              <li><Link href="/refund" className="text-slate-400 hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">Refund Policy</Link></li>
              <li><Link href="/disclaimer" className="text-slate-400 hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">Disclaimer</Link></li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800/50 bg-slate-950 relative z-10">
        <div className="container mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Copyright &copy; 2026 Asia D Market. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            <a href="#" className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary hover:border-primary transition-all duration-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
              <span className="sr-only">Facebook</span>
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary hover:border-primary transition-all duration-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
              <span className="sr-only">Twitter</span>
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary hover:border-primary transition-all duration-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
            </svg>
              <span className="sr-only">Instagram</span>
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary hover:border-primary transition-all duration-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
              </svg>
              <span className="sr-only">YouTube</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
