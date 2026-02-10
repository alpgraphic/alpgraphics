"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { ContentOverlay, SectionType } from "@/components/ContentOverlay";


const Scene = dynamic(() => import("@/components/Scene"), { ssr: false });

function HomeContent() {
  const searchParams = useSearchParams();
  const [time, setTime] = useState("");
  const [manualTheme, setManualTheme] = useState<'day' | 'night'>('day');

  // Initialize from URL param if present
  const initialSection = searchParams.get('section') as SectionType;
  const [activeSection, setActiveSection] = useState<SectionType>(initialSection || null);

  // Time update logic
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isNight = manualTheme === 'night';
  const toggleTheme = () => setManualTheme(prev => prev === 'day' ? 'night' : 'day');

  const themeClasses = isNight
    ? "bg-[#0a0a0a] text-[#f5f3e9]"
    : "bg-[#f5f3e9] text-[#1a1a1a]";

  return (
    <main className={`relative w-screen h-screen overflow-hidden transition-colors duration-700 ${themeClasses}`}>
      {/* Content Overlay System */}
      <ContentOverlay
        activeSection={activeSection}
        onClose={() => setActiveSection(null)}
        onSectionChange={setActiveSection}
        isNight={isNight}
      />

      {/* Premium Header */}
      <header className="absolute top-8 md:top-8 left-10 right-10 md:left-20 md:right-20 py-4 md:py-6 flex justify-between items-center z-20 pointer-events-none">
        {/* Logo - Premium Typography */}
        <div className="pointer-events-auto group cursor-default">
          <h1 className="text-[22px] md:text-[24px] font-[900] tracking-[-0.02em] transition-opacity group-hover:opacity-70"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
            alpgraphics
          </h1>
        </div>

        {/* Right Section: Nav Only */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setActiveSection(activeSection ? null : 'work')}
            className="md:hidden pointer-events-auto p-2 -mr-2"
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {activeSection ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="8" x2="20" y2="8" />
                  <line x1="4" y1="16" x2="20" y2="16" />
                </>
              )}
            </svg>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-8 pointer-events-auto">
            <button onClick={() => setActiveSection('work')} className={`text-sm font-medium transition-colors hover:opacity-100 ${activeSection === 'work' ? 'opacity-100' : 'opacity-60'}`}>Work</button>
            <button onClick={() => setActiveSection('about')} className={`text-sm font-medium transition-colors hover:opacity-100 ${activeSection === 'about' ? 'opacity-100' : 'opacity-60'}`}>Agency</button>
            <button onClick={() => setActiveSection('contact')} className={`text-sm font-medium transition-colors hover:opacity-100 ${activeSection === 'contact' ? 'opacity-100' : 'opacity-60'}`}>Contact</button>
            <a href="/login" className="text-sm font-medium transition-colors opacity-40 hover:opacity-100 ml-4 border-l border-current/20 pl-8">Login</a>
          </nav>
        </div>
      </header>

      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0">
        <Scene isNight={isNight} toggleTheme={toggleTheme} />
      </div>

      {/* Refined HUD Elements */}
      <div className="absolute inset-0 z-10 pointer-events-none px-6 py-6 md:px-12 md:py-8">
        {/* Bottom Right: Year & Location */}
        <div className="absolute bottom-18 right-6 md:bottom-18 md:right-18 text-right">
          <div className="text-[10px] md:text-[11px] font-[700] tracking-[0.15em] uppercase opacity-40 mb-[6px]">
            © 2026
          </div>
          <div className="text-[10px] md:text-[11px] font-[700] tracking-[0.15em] uppercase opacity-60">
            Turkey — {time}
          </div>
        </div>

        {/* Bottom Left: Date */}
        <div className="absolute bottom-18 left-6 md:bottom-18 md:left-18 z-10 pointer-events-none">
          <div className="text-[10px] md:text-[11px] font-[700] tracking-[0.15em] uppercase opacity-40 mb-[6px]">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
          <div className="text-[10px] md:text-[11px] font-[700] tracking-[0.15em] uppercase opacity-60">
            IST
          </div>
        </div>
      </div>


    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
