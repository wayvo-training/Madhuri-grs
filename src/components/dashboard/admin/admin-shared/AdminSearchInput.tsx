import { Search } from "lucide-react";

export interface AdminSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: AdminSearchInputProps) {
  return (
    <div className="relative min-w-52">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
        <Search className="h-4 w-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white"
      />
    </div>
  );
}
