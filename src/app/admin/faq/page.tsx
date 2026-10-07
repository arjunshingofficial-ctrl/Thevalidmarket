import { HelpCircle, Plus, Search, CheckCircle, Edit, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminFAQ() {
  const faqs = [
    { id: "1", question: "How do instant digital downloads work?", answer: "After payment confirmation, download links are instantly generated in your dashboard and emailed to you.", category: "Downloads" },
    { id: "2", question: "What payment methods are supported?", answer: "We support bKash, Nagad, Rocket, Upay, Cards, and International Crypto Payments.", category: "Payments" },
    { id: "3", question: "How do I request a refund?", answer: "Submit a support ticket within 7 days with your order ID if product delivery failed or file was defective.", category: "Refunds" },
    { id: "4", question: "Are license keys transferable?", answer: "Each license key is tied to your account unless specified as multi-user volume license.", category: "Licensing" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">FAQ Management</h1>
          <p className="text-slate-500 mt-1">Manage frequently asked questions for store & customer support</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New FAQ
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-600" /> Active FAQ List ({faqs.length})
          </h2>
        </div>
        <div className="divide-y divide-slate-200">
          {faqs.map((faq) => (
            <div key={faq.id} className="p-5 hover:bg-slate-50 flex justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md">
                    {faq.category}
                  </span>
                  <h3 className="font-semibold text-slate-900">{faq.question}</h3>
                </div>
                <p className="text-sm text-slate-600 mt-1">{faq.answer}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
