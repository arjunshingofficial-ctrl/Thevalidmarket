"use client";

import QRCode from "react-qr-code";
import { CopyButton } from "./CopyButton";
import { formatUsd, formatInr, formatBtc, formatUsdt } from "@/lib/currency";

export function PaymentDestinationCard({ 
  method, 
  settings, 
  amount, 
  currency, 
  reference 
}: { 
  method: string; 
  settings: any; 
  amount: number; 
  currency: string;
  reference?: string;
}) {
  const formatPaymentAmount = () => {
    if (currency === "INR") return formatInr(amount);
    if (currency === "BTC") return formatBtc(amount);
    if (currency === "USDT") return formatUsdt(amount);
    return formatUsd(amount);
  };

  let qrValue = "";
  if (method === "UPI" || method === "UPI_MANUAL") {
    // upi://pay?pa={upiId}&pn={receiverName}&am={amount}&cu=INR&tn={reference}
    const upiId = settings.vpa || "";
    const receiver = settings.receiverName || "D Market";
    qrValue = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(receiver)}&am=${amount}&cu=INR${reference ? `&tn=${encodeURIComponent(reference)}` : ''}`;
  } else if (method === "BTC") {
    const address = settings.btcAddress || "";
    // BIP21 bitcoin URI
    qrValue = `bitcoin:${address}?amount=${amount}${reference ? `&message=${encodeURIComponent(reference)}` : ''}`;
  } else if (method === "USDT" || method === "USDT_TRC20") {
    qrValue = settings.usdtAddress || "";
  }

  let hasValidConfig = false;
  if (method === "UPI" || method === "UPI_MANUAL") {
    hasValidConfig = !!settings.vpa && settings.vpa.trim() !== "";
  } else if (method === "BTC") {
    hasValidConfig = !!settings.btcAddress && settings.btcAddress.trim() !== "";
  } else if (method === "USDT" || method === "USDT_TRC20") {
    hasValidConfig = !!settings.usdtAddress && settings.usdtAddress.trim() !== "";
  }

  if (!hasValidConfig) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-center">
        <p className="text-red-700 font-medium">Payment destination unavailable.</p>
        <p className="text-red-600 text-sm mt-1">Contact support or choose another payment method.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden mt-6 mb-8">
      <div className="bg-slate-50 border-b border-slate-200 p-4 text-center">
        <h3 className="font-bold text-slate-800 tracking-wider">SCAN & PAY</h3>
      </div>
      
      <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        
        {/* Instructions Side */}
        <div className="flex-1 p-6 space-y-6">
          <div className="space-y-4">
            
            {(method === "UPI" || method === "UPI_MANUAL") && (
              <>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">UPI ID / VPA</p>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <span className="font-mono text-slate-900 font-medium break-all mr-3">{settings.vpa}</span>
                    <CopyButton text={settings.vpa} />
                  </div>
                </div>
                {settings.receiverName && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Receiver Name</p>
                    <p className="font-medium text-slate-900">{settings.receiverName}</p>
                  </div>
                )}
              </>
            )}

            {method === "BTC" && (
              <>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">BTC Wallet Address</p>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <span className="font-mono text-slate-900 font-medium break-all mr-3">{settings.btcAddress}</span>
                    <CopyButton text={settings.btcAddress} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Network</p>
                  <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-md">Bitcoin Mainnet</span>
                </div>
              </>
            )}

            {method === "USDT" && (
              <>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">USDT Wallet Address</p>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <span className="font-mono text-slate-900 font-medium break-all mr-3">{settings.usdtAddress}</span>
                    <CopyButton text={settings.usdtAddress} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Network</p>
                  <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md">
                    {settings.network || "TRC20"}
                  </span>
                </div>
              </>
            )}

            {reference && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Reference</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{reference}</span>
                  <CopyButton text={reference} label="Copy Ref" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* QR Side */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-50">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
            <QRCode value={qrValue} size={200} level="M" />
          </div>
          
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-1">Scan with your payment app to pay exactly:</p>
            <p className="text-2xl font-bold text-slate-900">{formatPaymentAmount()}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
