import { AlertCircle, ArrowLeft, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GrievanceNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mb-5 shadow-sm border border-amber-200/60 dark:border-amber-800/40">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
        Grievance Not Found
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        We couldn't find a grievance matching this ID or ticket number, or you
        may not have permission to view this case.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/end-user/dashboard">
          <Button variant="outline" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <Link href="/end-user/grievances">
          <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
            <ArrowLeft className="h-4 w-4" />
            View All Grievances
          </Button>
        </Link>
      </div>
    </div>
  );
}
