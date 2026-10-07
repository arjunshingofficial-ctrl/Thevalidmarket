import Link from "next/link";
import { ArrowRight, CheckCircle, Shield, Download, Star, ShieldCheck, Box, CreditCard, Lock, Mail, Users, TrendingUp } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { ReviewAvatar } from "@/components/reviews/ReviewAvatar";

export function HeroSection({ config, products }: { config: any, products: any[] }) {
  // Take up to 3 products for the floating cards visual
  const visualProducts = products.slice(0, 3);

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white pt-24 pb-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="flex flex-col items-start text-left gap-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              The Premium Digital Marketplace
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
              {config.heading || "Everything Digital.\nOne Marketplace."}
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed">
              {config.subheading || "Discover premium software, courses, tools, digital assets and professional digital services."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
              <Link href={config.primaryCtaUrl || "/store"} className="inline-flex h-14 items-center justify-center rounded-xl bg-white text-slate-950 px-8 text-base font-semibold transition-all hover:bg-slate-200 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                {config.primaryCta || "Explore Store"}
              </Link>
              <Link href={config.secondaryCtaUrl || "#categories"} className="inline-flex h-14 items-center justify-center rounded-xl border border-white/20 bg-white/5 backdrop-blur-md px-8 text-base font-medium transition-all hover:bg-white/10">
                {config.secondaryCta || "Browse Categories"}
              </Link>
            </div>
          </div>
          
          <div className="relative h-[400px] md:h-[500px] w-full hidden sm:block perspective-[1000px]">
            {visualProducts.map((p, i) => (
              <div 
                key={p.id} 
                className={`absolute p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl transition-transform duration-500 hover:-translate-y-2`}
                style={{
                  top: i === 0 ? '10%' : i === 1 ? '40%' : '60%',
                  left: i === 0 ? '10%' : i === 1 ? '40%' : '15%',
                  zIndex: 3 - i,
                  transform: `rotateX(10deg) rotateY(-15deg) translateZ(${i * 20}px) scale(${1 - i * 0.05})`
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Box className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">{p.category?.name || "Product"}</div>
                    <div className="text-sm font-semibold text-white truncate max-w-[150px]">{p.name}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                  <div className="font-bold text-lg">${p.price?.toFixed(2)}</div>
                  <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-xs">→</div>
                </div>
              </div>
            ))}
            {visualProducts.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-8 rounded-2xl bg-slate-900/50 backdrop-blur border border-white/5 text-slate-500 font-medium">
                  Products populating...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function StatsSection({ stats }: { stats: any }) {
  if (!stats) return null;
  return (
    <section className="bg-white border-b border-slate-100 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
          <div className="flex flex-col items-center text-center">
            <div className="text-3xl font-bold text-slate-900">{stats.productCount}+</div>
            <div className="text-sm text-slate-500 font-medium mt-1 uppercase tracking-wider">Premium Products</div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="text-3xl font-bold text-slate-900">{stats.categoryCount}</div>
            <div className="text-sm text-slate-500 font-medium mt-1 uppercase tracking-wider">Categories</div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="text-3xl font-bold text-slate-900">{stats.reviewCount}+</div>
            <div className="text-sm text-slate-500 font-medium mt-1 uppercase tracking-wider">Customer Reviews</div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="text-3xl font-bold text-slate-900">{stats.averageRating.toFixed(1)}</div>
            <div className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-1 uppercase tracking-wider">
              Average Rating <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 inline" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CategoriesSection({ categories, title, subtitle }: { categories: any[], title?: string, subtitle?: string }) {
  if (!categories || categories.length === 0) return null;
  
  return (
    <section id="categories" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center gap-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">{title || "Browse by Category"}</h2>
          <p className="text-lg text-slate-600 max-w-2xl">{subtitle || "Find exactly what you need from our curated selection."}</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link key={category.id} href={`/store?category=${category.slug}`} className="group flex flex-col items-center p-6 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/30 hover:-translate-y-1">
              <div className="p-4 rounded-xl bg-slate-50 text-slate-700 transition-colors group-hover:bg-primary/10 group-hover:text-primary mb-4">
                <Box className="h-8 w-8" />
              </div>
              <span className="font-semibold text-slate-900">{category.name}</span>
              <span className="text-xs text-slate-500 mt-2 font-medium">{category._count?.products || 0} products</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhyUsSection() {
  return (
    <section className="bg-slate-950 text-white py-24 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Why Asia D Market?</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">A marketplace built for security, speed, and premium quality.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-900/50 backdrop-blur border border-white/5 p-8 rounded-2xl transition-colors hover:bg-slate-900">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
              <Download className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Instant Digital Delivery</h3>
            <p className="text-slate-400 leading-relaxed">Access your purchased software, courses, and digital tools immediately after your payment is verified.</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur border border-white/5 p-8 rounded-2xl transition-colors hover:bg-slate-900">
            <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-6">
              <ShieldCheck className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Verified Products</h3>
            <p className="text-slate-400 leading-relaxed">Every digital product and service listed on our marketplace is strictly vetted for quality and safety.</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur border border-white/5 p-8 rounded-2xl transition-colors hover:bg-slate-900">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
              <Lock className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Secure Transactions</h3>
            <p className="text-slate-400 leading-relaxed">Manual payment verification ensures your orders are processed securely without automated fraud risks.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">How It Works</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">From discovery to download in a few simple steps.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-slate-100 -z-10"></div>
          
          <div className="flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-2xl bg-white border-2 border-slate-100 shadow-xl flex items-center justify-center mb-6 relative">
              <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm border-4 border-white">1</div>
              <Box className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Browse Store</h3>
            <p className="text-slate-600 text-sm">Discover premium software, templates, and courses.</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-2xl bg-white border-2 border-slate-100 shadow-xl flex items-center justify-center mb-6 relative">
              <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm border-4 border-white">2</div>
              <CreditCard className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Checkout Securely</h3>
            <p className="text-slate-600 text-sm">Pay using Crypto (BTC/USDT) or local UPI methods.</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-2xl bg-white border-2 border-slate-100 shadow-xl flex items-center justify-center mb-6 relative">
              <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm border-4 border-white">3</div>
              <Shield className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Manual Verification</h3>
            <p className="text-slate-600 text-sm">Submit your payment proof. We verify it to ensure security.</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-2xl bg-white border-2 border-slate-100 shadow-xl flex items-center justify-center mb-6 relative">
              <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm border-4 border-white">4</div>
              <Download className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Get Access</h3>
            <p className="text-slate-600 text-sm">Instantly access your downloads or license keys from your dashboard.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TrustSection() {
  return (
    <section className="bg-slate-50 py-16 border-y border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 opacity-70 grayscale">
          <div className="flex items-center gap-3 font-bold text-xl text-slate-800">
            <ShieldCheck className="h-8 w-8" /> Secure Accounts
          </div>
          <div className="flex items-center gap-3 font-bold text-xl text-slate-800">
            <Lock className="h-8 w-8" /> Protected Downloads
          </div>
          <div className="flex items-center gap-3 font-bold text-xl text-slate-800">
            <Star className="h-8 w-8" /> Verified Reviews
          </div>
        </div>
      </div>
    </section>
  );
}

export function NewsletterSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="relative z-10">
            <Mail className="h-12 w-12 text-white/50 mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Stay Ahead of the Curve</h2>
            <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">Get exclusive drops, useful digital tools, and updates straight to your inbox.</p>
            
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Email address" className="flex-1 rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary" required />
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-xl transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinalCtaSection({ config }: { config: any }) {
  return (
    <section className="py-24 bg-white border-t border-slate-100">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
          Ready to Build Your Digital Stack?
        </h2>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          Explore premium software, tools, and learning resources in one place.
        </p>
        <Link href="/store" className="inline-flex h-14 items-center justify-center rounded-xl bg-slate-900 text-white px-10 text-lg font-semibold transition-all hover:bg-slate-800 shadow-xl hover:shadow-2xl hover:-translate-y-1">
          Explore Store <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}

export function ReviewListSection({ reviews, title }: { reviews: any[], title?: string }) {
  if (!reviews || reviews.length === 0) return null;
  
  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">{title || "What Customers Say"}</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Real experiences from verified purchasers.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {reviews.slice(0, 3).map((review) => (
            <div key={review.id} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
              <div className="flex gap-1 mb-4 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < review.rating ? 'fill-yellow-400' : 'fill-slate-100 text-slate-200'}`} />
                ))}
              </div>
              <p className="text-slate-700 italic mb-8 flex-1 text-lg leading-relaxed">"{review.comment}"</p>
              
              <div className="flex items-center gap-4 mt-auto pt-6 border-t border-slate-100">
                <ReviewAvatar seed={review.avatarSeed} name={review.user?.name} size={48} />
                <div>
                  <div className="font-bold text-slate-900">{review.user?.name || "Customer"}</div>
                  <div className="text-xs text-slate-500 font-medium">{review.product?.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
