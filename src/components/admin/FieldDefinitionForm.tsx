"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FIELD_TYPES = ["TEXT", "NUMBER", "DROPDOWN", "MULTI_SELECT", "BOOLEAN", "DATE", "URL"];
const PRODUCT_TYPES = [
  "DIGITAL_DOWNLOAD", "SOFTWARE", "COURSE", "LICENSE", "SUBSCRIPTION",
  "VPN", "PROXY", "TEMPLATE", "DIGITAL_ASSET", "SERVICE"
];

interface FieldFormProps {
  initialData?: Record<string, unknown>;
  fieldId?: string;
  mode: "create" | "edit";
}

export default function FieldDefinitionForm({ initialData, fieldId, mode }: FieldFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState((initialData?.type as string) || "TEXT");
  const [applyToAll, setApplyToAll] = useState(!initialData?.applyToTypes);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const formData = new FormData(e.currentTarget);

    const endpoint = mode === "create" ? "/api/admin/custom-fields" : `/api/admin/custom-fields/${fieldId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(endpoint, { method, body: formData });
    if (res.ok) {
      router.push("/admin/custom-fields");
    } else {
      const data = await res.json();
      setError(data.error || "An error occurred");
    }
    setSaving(false);
  };

  const nameToSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {mode === "create" ? "New Custom Field" : `Edit: ${initialData?.name}`}
        </h1>
        <p className="text-slate-500 mt-1">Define a dynamic metadata field for products.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Field Name *</label>
            <input name="name" required defaultValue={initialData?.name as string}
              onChange={e => {
                const slugInput = e.currentTarget.form?.elements.namedItem("slug") as HTMLInputElement;
                if (slugInput && mode === "create") slugInput.value = nameToSlug(e.target.value);
              }}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Product Type, Coin, Platform" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Slug (auto-generated)</label>
            <input name="slug" required defaultValue={initialData?.slug as string}
              className="w-full border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. product-type" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Field Type *</label>
          <select name="type" required value={type} onChange={e => setType(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
            {FIELD_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
          </select>
        </div>

        {(type === "DROPDOWN" || type === "MULTI_SELECT") && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Options (comma-separated)</label>
            <input name="options" defaultValue={initialData?.options ? (() => {
              try { return (JSON.parse(initialData.options as string) as string[]).join(", "); } catch { return ""; }
            })() : ""}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Option A, Option B, Option C" />
            <p className="text-xs text-slate-400">Separate each option with a comma</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Default Value</label>
          <input name="defaultValue" defaultValue={initialData?.defaultValue as string}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Optional default value" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Sort Order</label>
          <input name="sortOrder" type="number" defaultValue={(initialData?.sortOrder as number) || 0}
            className="w-32 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700">Applies To Product Types</label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={applyToAll} onChange={e => setApplyToAll(e.target.checked)}
              className="rounded border-slate-300 text-primary focus:ring-primary" />
            <span className="text-sm text-slate-700">Apply to ALL product types</span>
          </label>
          {!applyToAll && (
            <div className="grid grid-cols-2 gap-2">
              {PRODUCT_TYPES.map(pt => (
                <label key={pt} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="applyToTypes" value={pt}
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                    defaultChecked={initialData?.applyToTypes ? (() => {
                      try { return (JSON.parse(initialData.applyToTypes as string) as string[]).includes(pt); } catch { return false; }
                    })() : false} />
                  <span className="text-sm text-slate-600">{pt.replace(/_/g, " ")}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 pt-2 border-t">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="required" value="true" defaultChecked={!!initialData?.required}
              className="rounded border-slate-300 text-primary focus:ring-primary" />
            <span className="text-sm text-slate-700 font-medium">Required field</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="isActive" value="true" defaultChecked={initialData?.isActive !== false}
              className="rounded border-slate-300 text-primary focus:ring-primary" />
            <span className="text-sm text-slate-700 font-medium">Active</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 border rounded-md text-sm font-medium bg-white hover:bg-slate-50 text-slate-700">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Saving..." : mode === "create" ? "Create Field" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
