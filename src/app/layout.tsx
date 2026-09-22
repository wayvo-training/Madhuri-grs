import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NavigationTracker } from "@/components/analytics/navigation-tracker";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GRS - Grievance Resolution System",
  description: "Enterprise Grievance Resolution & SLA Governance System",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <QueryProvider>
          <NavigationTracker />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
