"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "./actions";
import { Loader2 } from "lucide-react";

export default function NewUserClient({ roles }: { roles: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createUser(formData);

    if (result.success) {
      router.push("/admin/users");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input
            type="text"
            name="name"
            placeholder="John Doe"
            className="w-full px-3 py-2 border rounded-md outline-none focus:border-primary text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
          <input
            type="email"
            name="email"
            required
            placeholder="john@example.com"
            className="w-full px-3 py-2 border rounded-md outline-none focus:border-primary text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password <span className="text-red-500">*</span></label>
          <input
            type="password"
            name="password"
            required
            placeholder="Minimum 6 characters"
            minLength={6}
            className="w-full px-3 py-2 border rounded-md outline-none focus:border-primary text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Platform Account ID (Optional)</label>
          <input
            type="text"
            name="accountId"
            placeholder="e.g. 123456789"
            className="w-full px-3 py-2 border rounded-md outline-none focus:border-primary text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
          <select
            name="roleId"
            className="w-full px-3 py-2 border rounded-md outline-none focus:border-primary text-sm bg-white"
          >
            <option value="">Default User (USER)</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">Leave empty to assign standard user privileges.</p>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white px-6 py-2 rounded-md font-medium hover:bg-primary/90 flex items-center gap-2 disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create User"}
        </button>
      </div>
    </form>
  );
}
