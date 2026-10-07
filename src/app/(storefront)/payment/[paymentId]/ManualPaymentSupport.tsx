"use client";

import { useState } from "react";
import { MessageCircle, Send, Copy, Check } from "lucide-react";
import { formatUsd, formatInr } from "@/lib/currency";

interface ManualPaymentSupportProps {
  order: any;
  payment: any;
  settings: any;
  accountId: string | null;
}

export default function ManualPaymentSupport({ order, payment, settings, accountId }: ManualPaymentSupportProps) {
  const [copied, setCopied] = useState(false);

  const whatsappEnabled = settings.whatsappSupportEnabled === true;
  const telegramEnabled = settings.telegramSupportEnabled === true;
  
  if (!whatsappEnabled && !telegramEnabled) {
    return null;
  }

  const productName = order.items?.[0]?.product?.name || "Multiple Products";
  const productId = order.items?.[0]?.productId || "N/A";
  const orderRef = order.id.slice(0, 8).toUpperCase();
  
  // Try to use the explicit payment amount (which should be in INR for UPI), otherwise fallback
  const amountStr = payment.currency === "INR" 
    ? formatInr(payment.amount) 
    : payment.fxRate 
      ? formatInr((payment.baseAmount || order.total) * payment.fxRate)
      : formatInr(payment.amount || order.total);

  const messageText = `Hello Asia D Market Support,

I want to buy ${productName}.

Product: ${productName}
Product ID: ${productId}
Order ID: ASIA-${orderRef}
User ID: ${accountId || "N/A"}
Amount: ${amountStr}
Payment Method: UPI

Please send me the UPI ID and QR code for payment.

Thank you.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getWhatsAppUrl = () => {
    if (!settings.whatsappNumber) return "#";
    // Remove all +, -, spaces, parentheses
    const cleanNumber = settings.whatsappNumber.replace(/[\+\-\s\(\)]/g, '');
    return `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(messageText)}`;
  };

  const getTelegramUrl = () => {
    if (!settings.telegramUsername) return "#";
    let username = settings.telegramUsername.trim();
    if (username.startsWith("@")) username = username.substring(1);
    return `https://t.me/${username}?text=${encodeURIComponent(messageText)}`;
  };

  return (
    <div className="mt-8 pt-8 border-t border-slate-200">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 md:p-8">
        <h3 className="text-lg font-bold text-slate-900 mb-2 uppercase tracking-wide">Need help with UPI?</h3>
        <p className="text-slate-600 mb-6 text-sm">
          Complete your payment manually through our support team. Send your order details and our support team will provide the UPI ID and QR code.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {whatsappEnabled && (
            <a 
              href={getWhatsAppUrl()} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!settings.whatsappNumber) {
                  e.preventDefault();
                  alert("WhatsApp number is not configured in admin settings.");
                }
              }}
              className="flex-1 bg-[#25D366] text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-[#128C7E] transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp Support
            </a>
          )}
          
          {telegramEnabled && (
            <a 
              href={getTelegramUrl()} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 bg-[#0088cc] text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-[#0077b5] transition-colors"
            >
              <Send className="w-5 h-5 -mt-1 ml-1" />
              Telegram Support
            </a>
          )}
        </div>

        <button 
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors w-full justify-center bg-white border border-slate-200 rounded-lg py-2"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied to clipboard" : "Copy Payment Message"}
        </button>

        <p className="text-xs text-slate-500 mt-4 text-center">
          Your message will include your order details and Asia D Market User ID.
        </p>
      </div>
    </div>
  );
}
