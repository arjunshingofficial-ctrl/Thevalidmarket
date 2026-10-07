import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit, Trash2, ToggleLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomFieldsPage() {
  const fields = await prisma.fieldDefinition.findMany({
    orderBy: { sortOrder: "asc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Custom Fields</h1>
          <p className="text-slate-500 mt-1">Define dynamic metadata fields for product types.</p>
        </div>
        <Link 
          href="/admin/custom-fields/new" 
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Field
        </Link>
      </div>

      <div className="bg-slate-50 border rounded-lg p-4 text-sm text-slate-600">
        <strong>How it works:</strong> Custom fields allow you to define product-specific metadata (e.g. VPN Region, Software Version, Coin Type) 
        without changing application code. Fields can be scoped to specific product types and will automatically appear in the Product Editor.
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold">Field Name</th>
              <th className="px-6 py-4 font-semibold">Slug</th>
              <th className="px-6 py-4 font-semibold">Type</th>
              <th className="px-6 py-4 font-semibold">Applies To</th>
              <th className="px-6 py-4 font-semibold text-center">Required</th>
              <th className="px-6 py-4 font-semibold text-center">Active</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fields.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  <ToggleLeft className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="font-medium text-slate-900">No custom fields defined</p>
                  <p className="text-sm">Create fields like "Type", "Coin", "Platform", "Duration", "Region", etc.</p>
                </td>
              </tr>
            ) : (
              fields.map(field => (
                <tr key={field.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-slate-900">{field.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{field.slug}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">{field.type}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {field.applyToTypes ? (() => {
                      try { 
                        return (JSON.parse(field.applyToTypes) as string[]).join(", ");
                      } catch { return field.applyToTypes; }
                    })() : "All types"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {field.required ? (
                      <span className="text-emerald-600 font-bold">✓</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${field.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {field.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/custom-fields/${field.id}/edit`} className="p-1.5 text-slate-400 hover:text-primary rounded hover:bg-slate-100">
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
