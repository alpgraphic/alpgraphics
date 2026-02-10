"use client";

import { motion } from "framer-motion";

interface HeroSectionProps {
    logoUrl: string;
    categoryLabel?: string;  // "Brand Identity", "Logo Guidelines", etc. - editable
    categoryLabelColor?: string;  // Custom color for category label
    copyrightText?: string;
    year?: string;
    background: string;
    logoSize?: number;  // User-adjustable: 200-600px
    isNight?: boolean;
}

export default function HeroSection({
    logoUrl,
    categoryLabel = "Brand Identity",
    categoryLabelColor,
    copyrightText = "© Alpgraphics",
    year = new Date().getFullYear().toString(),
    background,
    logoSize = 400,
    isNight = false
}: HeroSectionProps) {
    return (
        <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative min-h-screen flex items-center justify-center px-8 md:px-20 py-20"
            style={{ background }}
        >
            {/* Center: Logo Only */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center justify-center"
            >
                {logoUrl && (
                    <img
                        src={logoUrl}
                        alt="Brand Logo"
                        className="w-auto h-auto object-contain"
                        style={{
                            maxWidth: `${logoSize}px`,
                            maxHeight: `${logoSize}px`
                        }}
                    />
                )}
            </motion.div>

            {/* Top Center: Category Label (Editable) */}
            {categoryLabel && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="absolute top-12 left-1/2 -translate-x-1/2"
                >
                    <p
                        className="text-xs md:text-sm font-bold uppercase tracking-[0.3em]"
                        style={{
                            color: categoryLabelColor || (isNight ? '#f5f3e9' : '#1a1a1a'),
                            opacity: categoryLabelColor ? 1 : 0.7
                        }}
                    >
                        {categoryLabel}
                    </p>
                </motion.div>
            )}

            {/* Bottom Left: Copyright */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="absolute bottom-12 left-8 md:left-20"
            >
                <p className="text-xs font-mono opacity-30">
                    {copyrightText}
                </p>
            </motion.div>

            {/* Bottom Right: Year */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="absolute bottom-12 right-8 md:right-20"
            >
                <p className="text-xs font-mono opacity-30">
                    {year}
                </p>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.2 }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2"
            >
                <div className="flex flex-col items-center gap-2 opacity-20">
                    <span className="text-[8px] uppercase tracking-[0.3em] font-mono">Scroll</span>
                    <motion.div
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M19 12l-7 7-7-7" />
                        </svg>
                    </motion.div>
                </div>
            </motion.div>
        </motion.section>
    );
}
