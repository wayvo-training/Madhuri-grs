import FaqAccordion from "@/components/ui/home/faqaccordion";
import Footer from "@/components/ui/home/footer";
import HeroSection from "@/components/ui/home/herosection";
import HowItsWork from "@/components/ui/home/howitswork";
import Navbar from "@/components/ui/home/navbar";
import SystemStatusBar from "@/components/ui/home/systemstatusbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <HeroSection
        headline="Resolve workplace concerns with clarity."
        subtext="Raise, track, and resolve workplace grievances through a structured and transparent process."
        ctaText="Raise a Grievance"
        ctaHref="/login"
      />

      <SystemStatusBar />

      <HowItsWork />

      <FaqAccordion />

      <Footer />
    </main>
  );
}
