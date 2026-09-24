import Footer from "@/components/ui/home/footer";
import GrievanceTracker from "@/components/ui/home/grievance-tracker";
import HeroSection from "@/components/ui/home/herosection";
import HowItsWork from "@/components/ui/home/howitswork";
import Navbar from "@/components/ui/home/navbar";

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background font-sans antialiased">
      {/* Pinned Navbar at the top (shrink-0, no scrollbar beside it) */}
      <Navbar />

      {/* Internal scroll container starting strictly below Navbar from the Hero Section down */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-smooth custom-scrollbar">
        <HeroSection
          headline="Resolve workplace concerns with clarity & trust."
          subtext="Raise, track, and resolve workplace grievances through a structured, confidential, and auditable process."
          ctaText="Raise a Grievance"
          ctaHref="/login"
        />

        <GrievanceTracker />

        <HowItsWork />

        <Footer />
      </main>
    </div>
  );
}
