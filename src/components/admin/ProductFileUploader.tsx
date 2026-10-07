"use client";

import { useState } from "react";
import { Upload, X, File as FileIcon, CheckCircle2, Archive, Loader2 } from "lucide-react";

interface ProductFile {
  id: string;
  filename: string;
  version: string;
  isLatest: boolean;
  isActive: boolean;
  createdAt: Date;
  fileSize: number;
}

interface ProductFileUploaderProps {
  productId: string;
  initialFiles: ProductFile[];
}

export default function ProductFileUploader({ productId, initialFiles }: ProductFileUploaderProps) {
  const [files, setFiles] = useState<ProductFile[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Simple validation (e.g. 500MB limit)
    if (selectedFile.size > 500 * 1024 * 1024) {
      setError("File exceeds 500MB limit");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("productId", productId);
    const version = prompt("Enter version (e.g. 1.0.1)", "1.0.0") || "1.0.0";
    formData.append("version", version);

    try {
      const res = await fetch("/api/admin/product-files", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());
      const newFile = await res.json();
      
      // Update local state: new file is latest, others are not
      setFiles(prev => [newFile, ...prev.map(f => ({ ...f, isLatest: false }))]);
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      e.target.value = ""; // reset input
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to permanently delete this file? Users who purchased this version will lose access to it.")) return;
    
    try {
      const res = await fetch(`/api/admin/product-files/${fileId}?productId=${productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border rounded-xl p-6 text-center border-dashed">
        <Upload className="mx-auto h-10 w-10 text-slate-400 mb-3" />
        <h3 className="font-medium text-slate-900">Upload Product File</h3>
        <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
          Securely upload digital products (ZIP, PDF, EXE, etc). Files are stored privately and only accessible to verified buyers.
        </p>
        <div className="relative inline-block">
          <input 
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
            onChange={handleUpload}
            disabled={uploading}
          />
          <button type="button" disabled={uploading} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center min-w-[150px]">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Select File"}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-slate-900">File Versions</h4>
        {files.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No files uploaded yet.</p>
        ) : (
          <div className="divide-y border rounded-lg overflow-hidden bg-white">
            {files.map(file => (
              <div key={file.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${file.isLatest ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                    <FileIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 flex items-center gap-2">
                      {file.filename}
                      {file.isLatest && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Latest</span>}
                      {!file.isActive && <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Archived</span>}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                      <span>Version: {file.version}</span>
                      <span>•</span>
                      <span>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handleDelete(file.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50" title="Delete">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
