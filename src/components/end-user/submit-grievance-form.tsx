"use client";

import {
  AlertCircle,
  AlignLeft,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  File as FileIcon,
  FileText,
  LayoutGrid,
  ListFilter,
  Loader2,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

const STEPS = [
  {
    number: 1,
    title: "Grievance Details",
    subtitle: "Provide basic information",
  },
  {
    number: 2,
    title: "Attach Documents",
    subtitle: "Upload supporting files",
  },
  {
    number: 3,
    title: "Review & Submit",
    subtitle: "Confirm and submit",
  },
];

export function SubmitGrievanceForm({
  categories,
  subcategories,
}: SubmitGrievanceFormProps) {
  const router = useRouter();

  // Wizard Step (1, 2, or 3)
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Grievance Details
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Step 2: Attach Documents
  const [files, setFiles] = useState<File[]>([]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submittedGrievanceNumber, setSubmittedGrievanceNumber] = useState<
    string | null
  >(null);
  const [copied, setCopied] = useState(false);

  // Check if all Step 1 required fields are filled
  const isStep1Complete =
    Boolean(categoryId) &&
    Boolean(subcategoryId) &&
    title.trim().length > 0 &&
    description.trim().length > 0;

  // Subcategories filtered by selected category
  const filteredSubcategories = subcategories.filter(
    (sub) => sub.category_id.toString() === categoryId,
  );

  const selectedCategoryName =
    categories.find((c) => c.category_id.toString() === categoryId)
      ?.category_name || "";

  const selectedSubcategoryName =
    subcategories.find((s) => s.subcategory_id.toString() === subcategoryId)
      ?.subcategory_name || "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((f) => {
        if (f.size > 5 * 1024 * 1024) {
          toast.error(
            `File "${f.name}" exceeds the 5 MB limit and was not added.`,
          );
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

  const handleNextFromStep1 = () => {
    if (!isStep1Complete) {
      if (!categoryId) toast.error("Please select a category.");
      else if (!subcategoryId) toast.error("Please select a subcategory.");
      else if (!title.trim()) toast.error("Please enter a title.");
      else if (!description.trim())
        toast.error("Please provide a description.");
      return;
    }
    setCurrentStep(2);
  };

  // Triggers Confirmation Popup
  const handleOpenConfirmModal = () => {
    if (!isStep1Complete) {
      toast.error("Please complete all required fields in Grievance Details.");
      setCurrentStep(1);
      return;
    }
    setShowConfirmModal(true);
  };

  // Executes Submission upon confirmation
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("categoryId", categoryId);
      formData.append("subcategoryId", subcategoryId);
      formData.append("title", title.trim());
      formData.append("description", description.trim());

      files.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/end-user/grievances", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        const errMsg =
          errData?.error || "Failed to submit grievance. Please try again.";
        toast.error(errMsg);
        setIsSubmitting(false);
        return;
      }

      const data = await res.json();
      setShowConfirmModal(false);
      setSubmittedGrievanceNumber(data.grievance_number);
      toast.success(
        `Grievance ${data.grievance_number} submitted successfully!`,
      );
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while submitting your grievance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyGrievanceId = () => {
    if (!submittedGrievanceNumber) return;
    navigator.clipboard.writeText(submittedGrievanceNumber);
    setCopied(true);
    toast.success("Grievance reference ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col md:flex-row w-full h-full min-h-0">
        {/* ========================================================= */}
        {/* LEFT SIDEBAR: STEPPER                                     */}
        {/* ========================================================= */}
        <aside className="w-full md:w-72 lg:w-80 bg-slate-50/60 md:border-r border-slate-200/80 p-6 sm:p-8 shrink-0 flex flex-col justify-between">
          <div className="space-y-7">
            {STEPS.map((step, idx) => {
              const isCompleted = currentStep > step.number;
              const isCurrent = currentStep === step.number;
              const isClickable = step.number < currentStep;

              return (
                <div
                  key={step.number}
                  className="relative flex items-start gap-4"
                >
                  {/* Connecting vertical line */}
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`absolute left-4 top-8 -bottom-7 w-0.5 transition-colors ${
                        currentStep > step.number
                          ? "bg-[#0F766E]"
                          : "bg-slate-200"
                      }`}
                    />
                  )}

                  {/* Step Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isClickable) setCurrentStep(step.number);
                    }}
                    disabled={!isClickable}
                    className={`flex items-start gap-4 text-left ${
                      isClickable ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <span
                      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                        isCurrent
                          ? "bg-[#0F766E] text-white shadow-sm ring-4 ring-teal-100"
                          : isCompleted
                            ? "bg-[#0F766E] text-white hover:bg-[#115E59]"
                            : "border-2 border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        step.number
                      )}
                    </span>

                    <span className="flex flex-col">
                      <span
                        className={`text-sm font-semibold tracking-tight transition-colors ${
                          isCurrent
                            ? "text-[#0F766E]"
                            : isCompleted
                              ? "text-slate-800"
                              : "text-slate-500"
                        }`}
                      >
                        {step.title}
                      </span>
                      <span className="text-2.75 text-slate-400 leading-tight mt-0.5">
                        {step.subtitle}
                      </span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Confidentiality Reminder in Sidebar */}
          <div className="hidden md:flex items-start gap-2.5 rounded-xl border border-teal-200 bg-teal-50/60 p-3.5 text-xs text-teal-950 mt-8">
            <ShieldCheck className="h-4 w-4 text-[#0F766E] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              All submitted grievances are handled with strict organizational
              confidentiality and auditable governance.
            </p>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* RIGHT CONTENT: FORM BODY                                  */}
        {/* ========================================================= */}
        <div className="flex-1 min-h-0 flex flex-col justify-between p-6 sm:p-9 overflow-y-auto custom-scrollbar">
          <div>
            {/* Header */}
            <div className="flex items-start gap-3.5 pb-6 border-b border-slate-100">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#0F766E] border border-teal-200 shadow-xs">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Submit a Grievance
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Provide the details of your concern. All fields marked with{" "}
                  <span className="text-red-500 font-semibold">*</span> are
                  mandatory.
                </p>
              </div>
            </div>

            {/* ===================================================== */}
            {/* STEP 1: GRIEVANCE DETAILS                             */}
            {/* ===================================================== */}
            {currentStep === 1 && (
              <div className="mt-6 space-y-5 animate-in fade-in-50">
                {/* Section Header Card */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Grievance Details
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select the appropriate category and provide a clear
                    description of your concern.
                  </p>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="category"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <LayoutGrid className="h-4 w-4" />
                    </div>
                    <select
                      id="category"
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        setSubcategoryId("");
                      }}
                      required
                      className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
                    >
                      <option value="" disabled>
                        Select a category
                      </option>
                      {categories.map((c) => (
                        <option
                          key={c.category_id.toString()}
                          value={c.category_id.toString()}
                        >
                          {c.category_name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Subcategory */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="subcategory"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Subcategory <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <ListFilter className="h-4 w-4" />
                    </div>
                    <select
                      id="subcategory"
                      value={subcategoryId}
                      onChange={(e) => setSubcategoryId(e.target.value)}
                      required
                      disabled={!categoryId}
                      className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-teal-100 transition disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled>
                        Select a subcategory
                      </option>
                      {filteredSubcategories.map((s) => (
                        <option
                          key={s.subcategory_id.toString()}
                          value={s.subcategory_id.toString()}
                        >
                          {s.subcategory_name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="title"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                      placeholder="Enter a brief title for your grievance"
                      required
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
                    />
                  </div>
                  <div className="flex justify-end text-2.75 text-slate-400">
                    {title.length}/100
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="description"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Description <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute top-3.5 left-3.5 text-slate-400">
                      <AlignLeft className="h-4 w-4" />
                    </div>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      maxLength={1000}
                      placeholder="Provide a detailed description of your concern..."
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 pt-3 pb-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-teal-100 transition resize-none"
                    />
                  </div>
                  <div className="flex items-center justify-between text-2.75 text-slate-400">
                    <span>
                      Be specific about dates, people involved, and impact.
                    </span>
                    <span>{description.length}/1000</span>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================== */}
            {/* STEP 2: ATTACH DOCUMENTS                              */}
            {/* ===================================================== */}
            {currentStep === 2 && (
              <div className="mt-6 space-y-5 animate-in fade-in-50">
                {/* Section Header Card */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Attach Documents
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload supporting files such as screenshots, emails, or
                    receipts (Optional, Max 5 MB each).
                  </p>
                </div>

                {/* Upload Dropzone */}
                <label
                  htmlFor="file-upload"
                  className="block rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-8 text-center transition hover:bg-slate-50 cursor-pointer focus-within:ring-2 focus-within:ring-[#0F766E]"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-[#0F766E] mb-3">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col items-center text-sm text-slate-600">
                    <span className="font-semibold text-slate-900 hover:text-[#0F766E] transition">
                      Drag and drop files here, or click to browse
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      PDF, JPG, PNG, DOC, DOCX up to 5 MB
                    </span>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="sr-only"
                  />
                </label>

                {/* Uploaded Files List */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Attached Files ({files.length})
                    </p>
                    <ul className="space-y-2">
                      {files.map((file, idx) => (
                        <li
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                          className="flex items-center justify-between py-2.5 px-3.5 rounded-xl border border-slate-200 bg-white text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileIcon className="h-4 w-4 text-[#0F766E] shrink-0" />
                            <span className="font-medium text-slate-800 truncate">
                              {file.name}
                            </span>
                            <span className="text-slate-400 shrink-0">
                              ({(file.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ===================================================== */}
            {/* STEP 3: REVIEW & SUBMIT                               */}
            {/* ===================================================== */}
            {currentStep === 3 && (
              <div className="mt-6 space-y-5 animate-in fade-in-50">
                {/* Section Header Card */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Review & Submit
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Confirm all details of your concern before final submission.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/30 p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200/80">
                    <div>
                      <span className="text-2.75 text-slate-400 font-semibold uppercase tracking-wider block">
                        Category
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {selectedCategoryName || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-2.75 text-slate-400 font-semibold uppercase tracking-wider block">
                        Subcategory
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {selectedSubcategoryName || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="pb-4 border-b border-slate-200/80">
                    <span className="text-2.75 text-slate-400 font-semibold uppercase tracking-wider block">
                      Grievance Title
                    </span>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                      {title}
                    </p>
                  </div>

                  <div className="pb-4 border-b border-slate-200/80">
                    <span className="text-2.75 text-slate-400 font-semibold uppercase tracking-wider block">
                      Description
                    </span>
                    <p className="text-sm text-slate-700 leading-relaxed mt-1 whitespace-pre-wrap">
                      {description}
                    </p>
                  </div>

                  <div className="text-xs">
                    <span className="text-slate-400 block font-medium">
                      Supporting Documents:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {files.length > 0
                        ? `${files.length} file(s) attached`
                        : "No files attached (Optional)"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* BOTTOM ACTION BAR                                         */}
          {/* ========================================================= */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
            {/* Left Action Button */}
            {currentStep === 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="rounded-xl border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="rounded-xl border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            )}

            {/* Right Action Button */}
            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={() => {
                  if (currentStep === 1) {
                    handleNextFromStep1();
                  } else {
                    setCurrentStep((prev) => Math.min(3, prev + 1));
                  }
                }}
                disabled={currentStep === 1 && !isStep1Complete}
                className="rounded-xl bg-[#0F766E] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#115E59] transition shadow-xs cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#0F766E]"
              >
                Next
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleOpenConfirmModal}
                disabled={isSubmitting}
                className="rounded-xl bg-[#0F766E] px-7 py-2.5 text-xs font-semibold text-white hover:bg-[#115E59] transition shadow-xs cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Grievance
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. CONFIRMATION POPUP ("Are you sure?")                    */}
      {/* ========================================================= */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-left space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Grievance Submission
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to submit this grievance? Once
                  submitted, it will be assigned an immutable reference ID and
                  forwarded to the department team for review.
                </p>
              </div>
            </div>

            {/* Quick summary recap */}
            <div className="rounded-xl bg-slate-50 p-3.5 text-xs space-y-1.5 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Category:</span>
                <span className="font-semibold text-slate-800">
                  {selectedCategoryName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Subcategory:</span>
                <span className="font-semibold text-slate-800">
                  {selectedSubcategoryName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Title:</span>
                <span className="font-semibold text-slate-800 max-w-[200px] truncate">
                  {title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Attachments:</span>
                <span className="font-semibold text-slate-800">
                  {files.length > 0 ? `${files.length} file(s)` : "None"}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Review Again
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSubmit}
                className="rounded-xl bg-[#0F766E] px-5 py-2 text-xs font-semibold text-white hover:bg-[#115E59] shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Yes, Submit Grievance
                    <Check className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SUCCESS POPUP WITH GRIEVANCE ID                        */}
      {/* ========================================================= */}
      {submittedGrievanceNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-5">
            {/* Animated Success Badge */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Grievance Submitted Successfully!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                Your grievance has been safely registered in the system and
                assigned to the redressal team.
              </p>
            </div>

            {/* Prominent Grievance ID Box */}
            <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-4 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                Grievance Reference Number
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-xl sm:text-2xl font-extrabold text-emerald-900 tracking-wider">
                  {submittedGrievanceNumber}
                </span>
                <button
                  type="button"
                  onClick={copyGrievanceId}
                  className="rounded-lg border border-emerald-200 bg-white p-1.5 text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                  title="Copy Reference ID"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-emerald-700 pt-1">
                Please save this ID to track your resolution status anytime.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/end-user/dashboard")}
                className="w-full sm:flex-1 rounded-xl border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Go to Dashboard
              </Button>
              <Button
                type="button"
                onClick={() => router.push("/end-user/grievances")}
                className="w-full sm:flex-1 rounded-xl bg-[#0F766E] py-2.5 text-xs font-semibold text-white hover:bg-[#115E59] shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                View in My Grievances
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
