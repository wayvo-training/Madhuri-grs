import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavigationTracker } from "@/components/analytics/navigation-tracker";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GRS - Grievance Resolution System",
  description: "Enterprise Grievance Resolution & SLA Governance System",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <NavigationTracker />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
