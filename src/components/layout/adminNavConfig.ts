import {
  LayoutDashboard, BarChart3, Package, Folders, SlidersHorizontal, HardDrive, Image,
  ShoppingCart, CreditCard, Receipt, Ticket, Repeat, Download, RefreshCcw,
  Users, Star, LifeBuoy, Link2,
  BookOpen, GraduationCap,
  FileText, FileSearch, Home, Menu, Megaphone, MessageSquare, HelpCircle,
  Search, Globe, ArrowLeftRight, Map, Bot,
  Tag, Share2, Bell, Mail,
  UserCheck, Shield, ShieldAlert, Settings, Plug, Sparkles
} from "lucide-react";

export type NavItem = { 
  name: string; 
  href: string; 
  icon: React.ElementType;
  badge?: string;
};

export type NavGroup = { 
  label: string; 
  items: NavItem[];
  color?: string;
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "OVERVIEW",
    color: "from-blue-500 to-cyan-500",
    items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ]
  },
  {
    label: "CATALOG",
    color: "from-emerald-500 to-teal-500",
    items: [
      { name: "Products", href: "/admin/products", icon: Package },
      { name: "VIP Free Drops", href: "/admin/products?category=vip-drops", icon: Sparkles },
      { name: "Categories", href: "/admin/categories", icon: Folders },
      { name: "Custom Fields", href: "/admin/custom-fields", icon: SlidersHorizontal },
      { name: "Product Files", href: "/admin/product-files", icon: HardDrive },
      { name: "Media Library", href: "/admin/media", icon: Image },
    ]
  },
  {
    label: "ORDERS & COMMERCE",
    color: "from-amber-500 to-orange-500",
    items: [
      { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { name: "Payments", href: "/admin/payments", icon: CreditCard },
      { name: "Payment Links", href: "/admin/payment-links", icon: Link2 },
      { name: "Payment Reviews", href: "/admin/payments/review", icon: ShieldAlert },
      { name: "Payment Settings", href: "/admin/settings/payments", icon: Receipt },
      { name: "Coupons", href: "/admin/coupons", icon: Ticket },
      { name: "Subscriptions", href: "/admin/subscriptions", icon: Repeat },
      { name: "Downloads", href: "/admin/downloads", icon: Download },
      { name: "Refunds", href: "/admin/refunds", icon: RefreshCcw },
    ]
  },
  {
    label: "CUSTOMERS",
    color: "from-purple-500 to-pink-500",
    items: [
      { name: "Customers", href: "/admin/customers", icon: Users },
      { name: "Reviews", href: "/admin/reviews", icon: Star },
      { name: "Community Chat", href: "/admin/chat", icon: MessageSquare },
      { name: "Support Tickets", href: "/admin/support", icon: LifeBuoy },
      { name: "Referrals", href: "/admin/referrals", icon: Link2 },
    ]
  },
  {
    label: "WALLET",
    color: "from-green-500 to-emerald-500",
    items: [
      { name: "Wallets", href: "/admin/wallets", icon: CreditCard },
      { name: "Deposits", href: "/admin/wallets/deposits", icon: Download },
      { name: "Settings", href: "/admin/settings/wallet", icon: Settings },
    ]
  },
  {
    label: "COURSES",
    color: "from-indigo-500 to-violet-500",
    items: [
      { name: "Courses", href: "/admin/courses", icon: BookOpen },
      { name: "Students", href: "/admin/students", icon: GraduationCap },
    ]
  },
  {
    label: "CONTENT",
    color: "from-rose-500 to-red-500",
    items: [
      { name: "Blog Posts", href: "/admin/blog", icon: FileText },
      { name: "Blog Comments", href: "/admin/blog/comments", icon: MessageSquare },
      { name: "Blog Categories", href: "/admin/blog/categories", icon: Folders },
      { name: "Pages", href: "/admin/pages", icon: FileSearch },
      { name: "Menus", href: "/admin/appearance/menus", icon: Menu },
      { name: "Homepage", href: "/admin/settings/homepage", icon: Home },
      { name: "Banners", href: "/admin/banners", icon: Megaphone },
      { name: "Testimonials", href: "/admin/testimonials", icon: MessageSquare },
      { name: "FAQ", href: "/admin/faq", icon: HelpCircle },
    ]
  },
  {
    label: "SEO",
    color: "from-sky-500 to-blue-500",
    items: [
      { name: "SEO Dashboard", href: "/admin/seo", icon: Search },
      { name: "Global SEO", href: "/admin/settings/seo", icon: Globe },
      { name: "Redirects", href: "/admin/settings/redirects", icon: ArrowLeftRight },
      { name: "Sitemap", href: "/admin/sitemap", icon: Map },
      { name: "Robots.txt", href: "/admin/robots", icon: Bot },
    ]
  },
  {
    label: "MARKETING",
    color: "from-yellow-500 to-amber-500",
    items: [
      { name: "Coupons", href: "/admin/coupons", icon: Tag },
      { name: "Referrals", href: "/admin/referrals", icon: Share2 },
      { name: "Notifications", href: "/admin/notifications", icon: Bell },
      { name: "Email Templates", href: "/admin/email-templates", icon: Mail },
    ]
  },
  {
    label: "USERS",
    color: "from-cyan-500 to-teal-500",
    items: [
      { name: "All Users", href: "/admin/users", icon: Users },
      { name: "Staff & Admins", href: "/admin/staff", icon: UserCheck },
      { name: "Roles & Permissions", href: "/admin/roles", icon: Shield },
    ]
  },
  {
    label: "SYSTEM",
    color: "from-slate-500 to-gray-500",
    items: [
      { name: "Notifications", href: "/admin/notifications", icon: Bell },
      { name: "Audit Logs", href: "/admin/audit-logs", icon: ShieldAlert },
      { name: "Settings", href: "/admin/settings", icon: Settings },
      { name: "Security", href: "/admin/security", icon: Shield },
      { name: "Integrations", href: "/admin/integrations", icon: Plug },
    ]
  },
];
