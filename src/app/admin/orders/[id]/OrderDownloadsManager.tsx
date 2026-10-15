"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DownloadCloud,
  File,
  Copy,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface ProductFile {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  version: string;
  product: {
    id: string;
    name: string;
    type: string;
  };
}

interface AssignedEntitlement {
  id: string;
  productId: string;
  status: string;
  metadata: string | null;
  createdAt: string;
  targetFile?: {
    id: string;
    originalName: string;
    fileSize: number;
    version: string;
    productName: string;
  } | null;
  downloadStats?: {
    downloadCount: number;
    lastDownload: string | null;
  } | null;
}

interface OrderDownloadsManagerProps {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  availableFiles: ProductFile[];
  initialAssignedDownloads: AssignedEntitlement[];
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function OrderDownloadsManager({
  orderId,
  orderNumber,
  customerEmail,
  availableFiles,
  initialAssignedDownloads,
}: OrderDownloadsManagerProps) {
  const router = useRouter();
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [customNote, setCustomNote] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showAssignForm, setShowAssignForm] = useState<boolean>(false);

  const handleCopyLink = (fileId: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://www.thevalidmarket.com";
    const directUrl = `${origin}/api/download/${fileId}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedId(fileId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileId) {
      setMsg({ type: "error", text: "Please select a file to assign." });
      return;
    }

    setIsAssigning(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/assign-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: selectedFileId, customNote }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assign download file");
      }

      setMsg({
        type: "success",
        text: `File "${data.file?.name}" assigned successfully! The customer can now download it directly from their dashboard.`,
      });
      setSelectedFileId("");
      setCustomNote("");
      setShowAssignForm(false);
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRevoke = async (entitlementId: string, fileName: string) => {
    if (!confirm(`Revoke access to "${fileName}" for this order?`)) return;

    setIsRevoking(entitlementId);
    setMsg(null);

    try {
      const res = await fetch(
        `/api/admin/orders/${orderId}/assign-download?entitlementId=${entitlementId}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to revoke access");
      }

      setMsg({
        type: "success",
        text: `Access to "${fileName}" has been revoked.`,
      });
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setIsRevoking(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3 bg-slate-50/60">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <DownloadCloud className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base leading-tight">
              Assigned Download Files &amp; Digital Access
            </h2>
            <p className="text-xs text-slate-500">
              Files available to {customerEmail} in their customer dashboard
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setShowAssignForm(!showAssignForm);
            setMsg(null);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{showAssignForm ? "Cancel Assignment" : "Assign New File"}</span>
        </button>
      </div>

      {/* Alert Messages */}
      {msg && (
        <div
          className={`mx-5 mt-4 p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
            msg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {msg.type === "success" ? (
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span className="flex-1">{msg.text}</span>
        </div>
      )}

      {/* Assign Form Drawer */}
      {showAssignForm && (
        <form
          onSubmit={handleAssign}
          className="m-5 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
        >
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Assign Available File to Customer Order #{orderNumber}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Select Available File from Catalog
            </label>
            <select
              value={selectedFileId}
              onChange={(e) => setSelectedFileId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            >
              <option value="">-- Choose a downloadable file --</option>
              {availableFiles.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.originalName} ({formatBytes(file.fileSize)}) — Product: {file.product.name} (v{file.version})
                </option>
              ))}
            </select>
            {availableFiles.length === 0 && (
              <p className="text-[11px] text-amber-600">
                No active product files found in your catalog. You can upload files under Admin &gt; Product Files.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Admin Note / Reason (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Requested updated binary / replacement license attachment"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAssignForm(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAssigning || !selectedFileId}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
            >
              {isAssigning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Assign &amp; Grant Dashboard Access</span>
            </button>
          </div>
        </form>
      )}

      {/* List of Assigned Downloads */}
      <div className="p-5">
        {initialAssignedDownloads.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <File className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No download files assigned to this order yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Click &quot;Assign New File&quot; above to give the customer instant dashboard download access.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {initialAssignedDownloads.map((ent) => {
              const meta = ent.metadata ? JSON.parse(ent.metadata) : {};
              const targetFile = ent.targetFile;
              const fileName = targetFile?.originalName || meta.fileName || "Download Package";
              const fileSize = targetFile ? formatBytes(targetFile.fileSize) : null;
              const fileId = targetFile?.id || meta.fileId;
              const directLink = fileId
                ? `${typeof window !== "undefined" ? window.location.origin : "https://www.thevalidmarket.com"}/api/download/${fileId}`
                : null;
              const isCopied = copiedId === fileId;

              return (
                <div
                  key={ent.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <File className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{fileName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {ent.status}
                        </span>
                        {targetFile?.version && (
                          <span className="text-[11px] font-mono text-slate-500">v{targetFile.version}</span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 flex items-center flex-wrap gap-2 mt-1">
                        {targetFile?.productName && (
                          <span>Product: <strong>{targetFile.productName}</strong></span>
                        )}
                        {fileSize && (
                          <>
                            <span>&bull;</span>
                            <span>{fileSize}</span>
                          </>
                        )}
                        <span>&bull;</span>
                        <span>
                          Downloaded {ent.downloadStats?.downloadCount || 0} time(s)
                        </span>
                      </div>

                      {meta.note && (
                        <p className="text-[11px] text-slate-400 italic mt-1">Note: {meta.note}</p>
                      )}

                      {/* Direct Link Preview */}
                      {directLink && (
                        <div className="mt-2 flex items-center gap-2 font-mono text-[11px] bg-white border border-slate-200 px-2.5 py-1 rounded-md text-slate-600 max-w-md truncate">
                          <span className="truncate">{directLink}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Copy Link, Test Download, Revoke */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {fileId && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(fileId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
                          title="Copy direct download link to share with customer"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-slate-500" />
                              <span>Copy Direct Link</span>
                            </>
                          )}
                        </button>

                        <a
                          href={`/api/download/${fileId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
                          target="_blank"
                          rel="noreferrer"
                          title="Test downloading the file"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                          <span>Download</span>
                        </a>
                      </>
                    )}

                    <button
                      type="button"
                      disabled={isRevoking === ent.id}
                      onClick={() => handleRevoke(ent.id, fileName)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Revoke download access"
                    >
                      {isRevoking === ent.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
