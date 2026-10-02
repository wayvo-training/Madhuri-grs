"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button 
      variant="outline" 
      onClick={() => window.print()} 
      className="flex items-center gap-2 rounded-xl text-sm font-medium print:hidden"
    >
      <Download className="h-4 w-4" />
      Download PDF
    </Button>
  );
}
