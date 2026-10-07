"use client";

import { useState } from "react";
import { Copy, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function LicenseKeyDisplay({ licenseKey }: { licenseKey: string }) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  // Strip out hidden unique suffix (e.g. ###cuid) if present
  const displayKey = licenseKey.split("###")[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(displayKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedKey = displayKey.replace(/.(?=.{4})/g, "•");

  return (
    <div className="flex items-center gap-2">
      <code className="bg-white px-3 py-1.5 rounded border border-slate-200 font-mono text-sm min-w-[280px] text-center inline-block text-slate-900 tracking-wider">
        {visible ? displayKey : maskedKey}
      </code>
      <button 
        onClick={() => setVisible(!visible)}
        className="p-1.5 text-slate-400 hover:text-primary rounded-md hover:bg-slate-200 transition-colors"
        title={visible ? "Hide" : "Show"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <button 
        onClick={handleCopy}
        className="p-1.5 text-slate-400 hover:text-primary rounded-md hover:bg-slate-200 transition-colors"
        title="Copy to clipboard"
      >
        {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
