"use client";

import { useState } from "react";
import { formatUsd } from "@/lib/currency";
import { updateUser, resetUserPassword, adjustUserWallet, deleteUser } from "@/lib/actions/users";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, Package, AlertTriangle, Key, Save, Plus, Minus, UserX, ExternalLink, CheckCircle2, Clock } from "lucide-react";

export default function ManageUserClient({ user, roles, walletBalance }: { user: any, roles: any[], walletBalance: any }) {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    roleId: user.roleId || "",
  });

  const [passwordForm, setPasswordForm] = useState({ newPassword: "" });
  
  const [walletForm, setWalletForm] = useState({
    amount: "",
    type: "ADD",
    reason: ""
  });

  const handleUpdateGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      await updateUser(user.id, formData);
      setSuccess("User details updated successfully");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      if (passwordForm.newPassword.length < 6) throw new Error("Password too short");
      await resetUserPassword(user.id, passwordForm.newPassword);
      setSuccess("Password reset successfully");
      setPasswordForm({ newPassword: "" });
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleWalletAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      const amount = parseFloat(walletForm.amount);
      if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");
      if (!walletForm.reason) throw new Error("Reason required");

      await adjustUserWallet(user.id, amount, walletForm.type as "ADD"|"REMOVE", walletForm.reason);
      setSuccess("Wallet adjusted successfully");
      setWalletForm({ amount: "", type: "ADD", reason: "" });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you absolutely sure? This cannot be undone.")) return;
    setLoading(true);
    try {
      await deleteUser(user.id);
      router.push("/admin/users");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const tabs = [
    { id: "general", label: "General" },
    { id: "wallet", label: "Wallet" },
    { id: "security", label: "Security" },
    { id: "orders", label: `Orders (${user.orders?.length || 0})` },
    { id: "danger", label: "Danger" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setError(""); setSuccess(""); }}
            className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? "border-primary text-primary" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 md:p-8">
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> {error}</div>}
        {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-lg text-sm border border-emerald-100">{success}</div>}

        {activeTab === "general" && (
          <form onSubmit={handleUpdateGeneral} className="max-w-2xl space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Account ID</label>
                <input
                  type="text"
                  disabled
                  value={user.accountId || "Not assigned"}
                  className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">User Role</label>
              <select
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border rounded-lg text-sm focus:border-primary outline-none"
              >
                <option value="">No Role (Default)</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <button disabled={loading} className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
              <Save className="h-4 w-4" /> Save Changes
            </button>
          </form>
        )}

        {activeTab === "wallet" && (
          <div className="max-w-2xl space-y-8">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500 mb-1">Current Balance</div>
                <div className="text-3xl font-bold text-emerald-600">{formatUsd(walletBalance?.total || 0)}</div>
              </div>
              <Wallet className="h-10 w-10 text-emerald-200" />
            </div>

            <form onSubmit={handleWalletAdjustment} className="bg-white border rounded-xl p-6 space-y-6 shadow-sm">
              <h3 className="font-semibold text-slate-800">Adjust Wallet Balance</h3>
              
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-3 border rounded-lg flex-1">
                  <input type="radio" checked={walletForm.type === "ADD"} onChange={() => setWalletForm({...walletForm, type: "ADD"})} className="text-primary focus:ring-primary h-4 w-4" />
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><Plus className="h-4 w-4 text-emerald-500"/> Add Funds</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-3 border rounded-lg flex-1">
                  <input type="radio" checked={walletForm.type === "REMOVE"} onChange={() => setWalletForm({...walletForm, type: "REMOVE"})} className="text-primary focus:ring-primary h-4 w-4" />
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><Minus className="h-4 w-4 text-red-500"/> Remove Funds</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={walletForm.amount}
                    onChange={(e) => setWalletForm({ ...walletForm, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border rounded-lg text-sm focus:border-primary outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reason (Required)</label>
                <input
                  type="text"
                  required
                  value={walletForm.reason}
                  onChange={(e) => setWalletForm({ ...walletForm, reason: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border rounded-lg text-sm focus:border-primary outline-none"
                  placeholder="e.g. Refund for Order #123"
                />
              </div>

               <button disabled={loading} className="w-full bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800">
                Execute Adjustment
              </button>
            </form>
          </div>
        )}

        {activeTab === "security" && (
          <form onSubmit={handleResetPassword} className="max-w-md space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Set New Password</label>
              <input
                type="text"
                required
                minLength={6}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ newPassword: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border rounded-lg text-sm focus:border-primary outline-none"
                placeholder="Enter new secure password"
              />
              <p className="text-xs text-slate-500 mt-2">The user will be able to log in immediately with this new password.</p>
            </div>
            <button disabled={loading} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-2">
              <Key className="h-4 w-4" /> Reset Password
            </button>
          </form>
        )}

        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">User Orders Overview</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total of {user.orders?.length || 0} lifetime orders on record.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/orders?userId=${user.id}`}
                  className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90 inline-flex items-center gap-1.5 shadow-xs"
                >
                  <span>Open in Orders Manager</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {user.orders?.length === 0 ? (
              <div className="p-12 text-center border rounded-xl bg-slate-50">
                <Package className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="font-medium text-slate-900">No Orders Found</h3>
                <p className="text-sm text-slate-500 mt-1">This user hasn't placed any orders yet.</p>
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-slate-600">Order ID</th>
                      <th className="px-6 py-3 font-semibold text-slate-600">Date</th>
                      <th className="px-6 py-3 font-semibold text-slate-600">Status</th>
                      <th className="px-6 py-3 font-semibold text-slate-600">Payment</th>
                      <th className="px-6 py-3 font-semibold text-right text-slate-600">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {user.orders?.map((order: any) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 font-mono text-xs font-bold text-slate-900">
                          <Link href={`/admin/orders/${order.id}`} className="hover:text-primary hover:underline">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-slate-600 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            order.orderStatus === "FULFILLED" 
                              ? "bg-blue-100 text-blue-700" 
                              : order.orderStatus === "PENDING"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            order.paymentStatus === "PAID" 
                              ? "bg-emerald-100 text-emerald-700" 
                              : order.paymentStatus === "PENDING"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-slate-900">{formatUsd(order.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "danger" && (
          <div className="max-w-2xl border border-red-200 bg-red-50/50 rounded-xl p-6">
            <h3 className="font-bold text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Danger Zone
            </h3>
            <p className="text-sm text-red-600/80 mt-2 mb-6">
              Deleting this user will permanently remove their account, orders, wallet, and all associated data. This action cannot be reversed.
            </p>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2"
            >
              <UserX className="h-4 w-4" /> Delete User Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
