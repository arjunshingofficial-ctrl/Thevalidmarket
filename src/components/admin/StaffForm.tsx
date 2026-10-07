"use client";

import { useState } from "react";
import { updateUserRole } from "@/lib/actions/admin";

interface StaffFormProps {
  staff: any[];
  roles: any[];
}

export default function StaffForm({ staff, roles }: StaffFormProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, roleName: string) => {
    setUpdating(userId);
    try {
      await updateUserRole(userId, roleName);
    } catch (err: any) {
      alert(err.message || "Failed to update role");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 border-b">
          <tr>
            <th className="px-6 py-3 font-medium">User</th>
            <th className="px-6 py-3 font-medium">Email</th>
            <th className="px-6 py-3 font-medium">Role</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {staff.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-6 py-8 text-center text-slate-500">No staff found.</td>
            </tr>
          ) : (
            staff.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{user.name || "N/A"}</td>
                <td className="px-6 py-4 text-slate-600">{user.email}</td>
                <td className="px-6 py-4">
                  <select 
                    defaultValue={user.role?.name || ""}
                    disabled={updating === user.id}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="" disabled>Select Role</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
