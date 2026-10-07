"use client";

import MediaSelector from "@/components/admin/MediaSelector";

export default function MediaLibraryClient() {
  const handleSelect = (url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        alert("Image URL copied to clipboard: " + url);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        prompt("Copy this URL:", url);
      });
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <MediaSelector onSelect={handleSelect} />
    </div>
  );
}
