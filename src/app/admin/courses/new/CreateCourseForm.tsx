"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCourseAction } from "@/lib/actions/courses";
import { Loader2 } from "lucide-react";

export default function CreateCourseForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const instructor = formData.get("instructor") as string;
    const price = parseFloat(formData.get("price") as string) || 0;
    const salePriceStr = formData.get("salePrice") as string;
    const salePrice = salePriceStr ? parseFloat(salePriceStr) : undefined;
    const shortDesc = formData.get("shortDesc") as string;
    const description = formData.get("description") as string;
    const thumbnailUrl = formData.get("thumbnailUrl") as string;

    try {
      const res = await createCourseAction({
        name,
        instructor,
        price,
        salePrice,
        shortDesc,
        description,
        thumbnailUrl: thumbnailUrl || undefined,
      });

      if (res.success && res.courseId) {
        router.push(`/admin/courses/${res.courseId}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create course");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Course Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. Master Full-Stack Web Development"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Instructor Name
          </label>
          <input
            type="text"
            name="instructor"
            placeholder="e.g. Dr. John Doe"
            defaultValue="Asia D Market Academy"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Regular Price (৳) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              name="price"
              required
              min="0"
              defaultValue="1500"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Sale / Discount Price (৳) <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="number"
              step="any"
              name="salePrice"
              min="0"
              placeholder="e.g. 990"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Short Summary / Tagline
          </label>
          <input
            type="text"
            name="shortDesc"
            placeholder="Brief 1-line overview of what students will master"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Full Course Description
          </label>
          <textarea
            name="description"
            rows={5}
            placeholder="Provide comprehensive details about syllabus, outcomes, prerequisites..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Course Thumbnail URL <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="url"
            name="thumbnailUrl"
            placeholder="https://example.com/course-thumbnail.jpg"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="mt-1 text-xs text-slate-400">Recommended: 1280×720px (16:9). You can update this later from the course editor.</p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Course & Add Curriculum
        </button>
      </div>
    </form>
  );
}
