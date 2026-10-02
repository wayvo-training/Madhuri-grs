import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NavigationTracker } from "@/components/analytics/navigation-tracker";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const themeScript = `
    (function() {
      try {
        var localTheme = localStorage.getItem('theme');
        var theme = localTheme || 'system';
        
        if (theme === 'system') {
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.add('light');
          }
        } else {
          document.documentElement.classList.add(theme);
        }
      } catch (e) {}
    })();
  `;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} font-sans h-full antialiased`}
    >
      <head />
      <body
        className="min-h-full flex flex-col font-sans"
        suppressHydrationWarning
      >
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <ThemeProvider>
          <QueryProvider>
            <NavigationTracker />
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
