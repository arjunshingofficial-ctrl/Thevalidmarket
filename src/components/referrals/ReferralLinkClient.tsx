"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Share2 } from "lucide-react";

export default function ReferralLinkClient({ referralCode }: { referralCode: string }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [baseUrl, setBaseUrl] = useState("https://asiadmarket.com");
  
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const referralLink = `${baseUrl}/register?ref=${referralCode}`;

  const handleCopy = (text: string, type: 'link' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join Asia D Market',
        text: 'Sign up using my referral link!',
        url: referralLink,
      }).catch(console.error);
    } else {
      handleCopy(referralLink, 'link');
    }
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Your Referral Link</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 bg-slate-50 border rounded-md px-3 py-2 text-sm text-slate-600 font-mono truncate select-all flex items-center">
            {referralLink}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(referralLink, 'link')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copiedLink ? "Copied" : "Copy Link"}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Your Referral Code</h3>
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border rounded-md px-4 py-2 font-mono font-bold text-lg text-primary select-all">
            {referralCode}
          </div>
          <button
            onClick={() => handleCopy(referralCode, 'code')}
            className="flex items-center justify-center gap-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors"
          >
            {copiedCode ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copiedCode ? "Copied" : "Copy Code"}
          </button>
        </div>
      </div>
    </div>
  );
}
