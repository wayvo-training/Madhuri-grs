"use client";

import { useState } from "react";
import { UploadCloud, X, File as FileIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Category {
  category_id: bigint | string;
  category_name: string;
}

interface Subcategory {
  subcategory_id: bigint | string;
  category_id: bigint | string;
  subcategory_name: string;
}

interface SubmitGrievanceFormProps {
  categories: Category[];
  subcategories: Subcategory[];
}

export function SubmitGrievanceForm({ categories, subcategories }: SubmitGrievanceFormProps) {
  const router = useRouter();
  
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const filteredSubcategories = subcategories.filter(
    (sub) => sub.category_id.toString() === categoryId
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(f => {
        if (f.size > 5 * 1024 * 1024) {
          toast.error(`Size exceed! File ${f.name} is larger than 5 MB and was not added.`);
          return false;
        }
        return true;
      });
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("categoryId", categoryId);
      formData.append("subcategoryId", subcategoryId);
      formData.append("problemStatement", problemStatement);
      
      files.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/end-user/grievances", {
        method: "POST",
        body: formData, // the browser will automatically set the Content-Type header with the boundary
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("API Error Response:", errText);
        alert(`SERVER ERROR: ${errText}`);
        setIsSubmitting(false);
        return;
      }

      const data = await res.json();
      toast.success(`Grievance ${data.grievance_number} submitted successfully!`);
      router.push("/end-user/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(`FETCH/NETWORK ERROR: ${String(error)}`);
      toast.error("An error occurred while submitting your grievance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 sm:p-8 flex-1 space-y-8 overflow-y-auto max-h-[70vh]">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Grievance Details</h2>
          <p className="text-sm text-slate-500 mt-1">Fill in the information about your grievance. Fields marked with <span className="text-rose-500">*</span> are mandatory.</p>
        </div>

        <div className="space-y-6">
          {/* Category */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Category <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId("");
                }}
                required
                className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="" disabled>Select a category</option>
                {categories.map((c) => (
                  <option key={c.category_id.toString()} value={c.category_id.toString()}>
                    {c.category_name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            <p className="text-xs text-slate-500">Choose the category that best matches your issue.</p>
          </div>

          {/* Subcategory */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Subcategory <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                required
                disabled={!categoryId}
                className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:bg-slate-50"
              >
                <option value="" disabled>Select a subcategory</option>
                {filteredSubcategories.map((s) => (
                  <option key={s.subcategory_id.toString()} value={s.subcategory_id.toString()}>
                    {s.subcategory_name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            <p className="text-xs text-slate-500">Choose the subcategory for a more specific classification.</p>
          </div>

          {/* Problem Statement */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Problem Statement <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <textarea
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                required
                maxLength={1000}
                rows={5}
                placeholder="Describe your grievance in detail..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
              />
              <div className="absolute bottom-3 right-4 text-xs font-medium text-slate-400">
                {problemStatement.length}/1000
              </div>
            </div>
            <p className="text-xs text-slate-500">Provide a clear and detailed description of the issue, including relevant dates, people involved (if any), and impact.</p>
          </div>

          {/* Supporting Documents */}
          <div className="space-y-2">
            <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Supporting Documents (Optional)
            </span>
            <label
              htmlFor="file-upload"
              className="mt-1 block rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-8 text-center transition hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-teal-500 focus-within:ring-offset-2"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 mb-3">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div className="mt-2 flex text-sm leading-6 text-slate-600 justify-center">
                <span className="font-semibold text-slate-900 dark:text-slate-300 hover:text-teal-600 transition">
                  Drag and drop files here, or click to browse
                </span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </div>
              <p className="text-xs leading-5 text-slate-500 mt-2">
                Upload relevant documents (e.g., screenshots, emails, images, PDFs)<br/>
                Max file size: 5 MB per file. Supported formats: PDF, JPG, PNG, DOC, DOCX
              </p>
            </label>

            {/* Uploaded Files List */}
            {files.length > 0 && (
              <ul className="mt-4 space-y-2">
                {files.map((file, idx) => (
                  <li key={idx} className="flex items-center justify-between py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 text-rose-500">
                        <FileIcon className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{file.name}</span>
                        <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 font-bold px-6 py-2 h-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!categoryId || !subcategoryId || !problemStatement.trim() || isSubmitting}
          className="rounded-xl bg-[#0F766E] text-white hover:bg-[#0D655E] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-bold px-6 py-2 h-auto"
        >
          {isSubmitting ? "Submitting..." : "Submit Grievance"}
        </Button>
      </div>
    </form>
  );
}
