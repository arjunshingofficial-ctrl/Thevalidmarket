"use client";

import { useState, useEffect } from "react";
import { Upload, X, Check, Image as ImageIcon, Search, Loader2 } from "lucide-react";

interface Media {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
}

interface MediaSelectorProps {
  onSelect: (url: string) => void;
  multiple?: boolean;
}

export default function MediaSelector({ onSelect, multiple = false }: MediaSelectorProps) {
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchMedia = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/media");
    if (res.ok) {
      setMediaList(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        await fetchMedia();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const filteredMedia = mediaList.filter(m => m.filename.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search media..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="relative inline-block">
          <input 
            type="file" 
            accept="image/*,video/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
            onChange={handleUpload}
            disabled={uploading}
          />
          <button type="button" disabled={uploading} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center gap-2">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4" /> Upload</>}
          </button>
        </div>
      </div>

      <div className="bg-slate-50 border rounded-xl p-4 min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center h-full py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No media found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredMedia.map(media => (
              <div 
                key={media.id} 
                onClick={() => onSelect(media.url)}
                className="group relative aspect-square border rounded-lg overflow-hidden bg-white cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              >
                {media.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={media.url} alt={media.filename} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full bg-slate-100 text-slate-400">
                    <span className="text-xs font-medium uppercase">{media.mimeType.split("/")[1]}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-medium">Select</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
