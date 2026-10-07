"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCoupon, updateCoupon } from "@/lib/actions/admin";

interface CouponFormProps {
  initialData?: any;
  couponId?: string;
  mode: "create" | "edit";
}

export default function CouponForm({ initialData, couponId, mode }: CouponFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const formData = new FormData(e.currentTarget);

    try {
      if (mode === "create") {
        await createCoupon(formData);
      } else {
        await updateCoupon(couponId!, formData);
        router.push("/admin/coupons");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {mode === "create" ? "New Coupon" : `Edit Coupon: ${initialData?.code}`}
        </h1>
        <p className="text-slate-500 mt-1">Manage discount coupons.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Coupon Code *</label>
          <input name="code" required defaultValue={initialData?.code}
            className="w-full border rounded-md px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="e.g. SUMMER50" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Discount Type *</label>
            <select name="discountType" required defaultValue={initialData?.discountType || "PERCENTAGE"}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount ($)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Discount Value *</label>
            <input name="discountValue" type="number" step="0.01" min="0" required defaultValue={initialData?.discountValue}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Maximum Uses</label>
            <input name="maxUses" type="number" min="1" defaultValue={initialData?.maxUses || ""}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Leave blank for unlimited" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Expires At</label>
            <input name="expiresAt" type="datetime-local" 
              defaultValue={initialData?.expiresAt ? new Date(initialData.expiresAt).toISOString().slice(0, 16) : ""}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 border rounded-md text-sm font-medium bg-white hover:bg-slate-50 text-slate-700">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Saving..." : "Save Coupon"}
        </button>
      </div>
    </form>
  );
}
