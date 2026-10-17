import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import Link from "next/link";
import {
  Send,
  MessageCircle,
  Mail,
  ShieldCheck,
  Clock,
  ChevronRight,
  Headphones,
  Zap,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import ContactForm from "./ContactForm";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  const siteName = settings?.siteName || "The Valid Market";

  return {
    title: `Contact Support & Technical Help Desk | ${siteName}`,
    description: `Connect with ${siteName} 24/7 support team. Get dedicated technical help, order verification, course assistance, and billing support via Telegram, WhatsApp, VIP Live Chat, and Email.`,
    alternates: {
      canonical: "/contact",
    },
    openGraph: {
      title: `Contact 24/7 Support | ${siteName}`,
      description: `Need assistance with an order, course, or digital license? Reach out to ${siteName} support via Telegram, WhatsApp, or instant contact desk.`,
      url: "/contact",
      type: "website",
    },
  };
}

export default async function ContactPage() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });

  let telegramUrl = "";
  let telegramActive = true;
  let whatsappUrl = "";
  let whatsappActive = true;
  let supportEmail = "support@thevalidmarket.com";

  if (settings?.footerConfig) {
    try {
      const parsed = JSON.parse(settings.footerConfig);
      if (parsed.telegramUrl !== undefined) telegramUrl = parsed.telegramUrl;
      if (parsed.telegramActive !== undefined) telegramActive = !!parsed.telegramActive;
      if (parsed.whatsappUrl !== undefined) whatsappUrl = parsed.whatsappUrl;
      if (parsed.whatsappActive !== undefined) whatsappActive = !!parsed.whatsappActive;
      if (parsed.supportEmail) supportEmail = parsed.supportEmail;
    } catch (e) {
      console.error("Failed to parse footerConfig in contact page:", e);
    }
  }

  const isTelegramVisible = telegramActive && !!telegramUrl.trim();
  const isWhatsAppVisible = whatsappActive && !!whatsappUrl.trim();

  // Helper for WhatsApp click link
  const formattedWhatsAppUrl = (() => {
    if (!whatsappUrl) return "";
    const trimmed = whatsappUrl.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    const digits = trimmed.replace(/[^\d]/g, "");
    return digits ? `https://wa.me/${digits}` : "";
  })();

  // Helper for Telegram click link
  const formattedTelegramUrl = (() => {
    if (!telegramUrl) return "";
    const trimmed = telegramUrl.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    const clean = trimmed.replace(/^@/, "");
    return `https://t.me/${clean}`;
  })();

  const faqs = [
    {
      q: "How fast is delivery after checkout?",
      a: "All digital software, license keys, and course enrollments are automatically dispatched instantly to your dashboard within 1–30 seconds of payment confirmation.",
    },
    {
      q: "How do I access my purchased course syllabus?",
      a: "Once enrolled, navigate to your Student Dashboard > Courses to stream all HD video lectures, lab instructions, and syllabus materials anytime with lifetime access.",
    },
    {
      q: "What should I do if my payment or wallet deposit is pending review?",
      a: "Manual mobile banking or crypto deposits are usually approved within 5–15 minutes. You can attach your Transaction ID in the contact form or send a screenshot on Telegram/WhatsApp for instant VIP verification.",
    },
    {
      q: "How does the satisfaction guarantee work?",
      a: "We maintain a 100% verified replacement warranty on digital assets and responsive 24/7 technical mentoring if you experience any issue.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {/* ── Top Hero Banner ── */}
      <section className="bg-slate-950 text-white relative overflow-hidden border-b border-slate-800">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[250px] bg-primary/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-[400px] h-[200px] bg-emerald-500/10 blur-[110px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-200">Contact Us</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-4">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>24/7 Live Technical &amp; Sales Support</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
              We&apos;re Here to Help You Master the Grid.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-medium">
              Have questions regarding course curriculum, software licenses, wallet deposits, or custom orders?
              Reach out directly across our instant messaging channels or submit a support ticket.
            </p>
          </div>
        </div>
      </section>

      {/* ── Direct Support Channels Cards ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* 1. Telegram Card (Conditional) */}
          {isTelegramVisible && (
            <a
              href={formattedTelegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:border-[#0088cc]/60 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0088cc]/10 text-[#0088cc] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                    <Send className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0088cc]/10 text-[#0088cc] border border-[#0088cc]/20">
                    Live Channel
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#0088cc] transition-colors">
                  Telegram VIP Support
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Chat directly with our verified technical mentors and receive real-time updates.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0088cc]">
                <span>Open Telegram Chat</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          )}

          {/* 2. WhatsApp Card (Conditional) */}
          {isWhatsAppVisible && (
            <a
              href={formattedWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:border-[#25D366]/60 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20">
                    Instant Chat
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#25D366] transition-colors">
                  WhatsApp Support
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Fast mobile support for order questions, payment screenshots, and instant verification.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#25D366]">
                <span>Chat on WhatsApp</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          )}

          {/* 3. VIP Live Chat */}
          <Link
            href="/chat"
            className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:border-primary/60 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Online
                </span>
              </div>
              <h3 className="font-extrabold text-base text-slate-900 group-hover:text-primary transition-colors">
                VIP Live Chat Room
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Connect directly in real-time with verified community members and online support agents.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-primary">
              <span>Join Live Chat</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* 4. Official Support Email */}
          <a
            href={`mailto:${supportEmail}`}
            className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:border-amber-400/60 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <Mail className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Official Desk
                </span>
              </div>
              <h3 className="font-extrabold text-base text-slate-900 group-hover:text-amber-600 transition-colors">
                Official Support Email
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed break-all">
                {supportEmail}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
              <span>Send Email</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </a>
        </div>
      </div>

      {/* ── Main Form & FAQs Section ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <ContactForm />
          </div>

          {/* Right: Helpful Overview & FAQs (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Guarantee / Response Card */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Guaranteed Response SLA</h3>
                  <p className="text-xs text-slate-400">Average response time: under 2 hours</p>
                </div>
              </div>

              <div className="pt-2 divide-y divide-slate-800 text-xs text-slate-300 space-y-3">
                <div className="flex items-center gap-2 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>24/7 Ticket and Direct Messaging Monitoring</span>
                </div>
                <div className="flex items-center gap-2 pt-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automated Instant Replacement for Valid Licenses</span>
                </div>
                <div className="flex items-center gap-2 pt-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Direct Technical Mentorship on Course Labs</span>
                </div>
              </div>
            </div>

            {/* Quick FAQs */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Frequently Asked Questions
                </h3>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <h4 className="font-bold text-xs text-slate-900 leading-snug">
                      {faq.q}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
