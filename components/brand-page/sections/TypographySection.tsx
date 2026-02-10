"use client";

import { motion } from "framer-motion";

interface SizeConfig {
    logoLightSize?: number;
    logoDarkSize?: number;
    iconLightSize?: number;
    iconDarkSize?: number;
    headingFontSize?: number;
    bodyFontSize?: number;
}

interface TypographySectionProps {
    headingFont: {
        name: string;
        weights?: number[];
        file?: string;
    };
    bodyFont: {
        name: string;
        weights?: number[];
        file?: string;
    };
    sizeConfig?: SizeConfig;
    title?: string;
    subtitle?: string;
    showWeights?: boolean;
    isNight?: boolean;
}

export default function TypographySection({
    headingFont,
    bodyFont,
    sizeConfig,
    title,
    subtitle,
    showWeights = true,
    isNight = false
}: TypographySectionProps) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_+-=[]{}|;':\",./<>?";

    // Get font family style - use uploaded font name or fallback
    const headingFontStyle = headingFont?.name ? { fontFamily: `'${headingFont.name}', sans-serif` } : {};
    const bodyFontStyle = bodyFont?.name ? { fontFamily: `'${bodyFont.name}', sans-serif` } : {};

    // Get font sizes from sizeConfig
    const headingFontSize = sizeConfig?.headingFontSize || 72;
    const bodyFontSize = sizeConfig?.bodyFontSize || 18;


    return (
        <section className={`w-full py-32 px-8 md:px-20 ${isNight ? 'bg-[#f5f3e9] text-[#1a1a1a]' : 'bg-[#0a0a0a]/5 text-[#1a1a1a]'}`}>
            <div className="max-w-7xl mx-auto">
                {/* Section Title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mb-24 text-center"
                >
                    <h2 className="text-5xl md:text-7xl font-[900] tracking-tighter mb-6">
                        {title || "Typography System"}
                    </h2>
                    <p className="text-lg opacity-50 max-w-3xl mx-auto leading-relaxed mt-4">
                        {subtitle || "Carefully selected typefaces that define the brand's voice and personality"}
                    </p>
                </motion.div>

                {/* Font Showcases - with spacing */}
                <div className="space-y-20">
                    {/* Heading Font */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="bg-white rounded-3xl p-12 md:p-16 shadow-sm"
                    >
                        <div className="mb-8">
                            <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40 mb-2">Heading Font</h3>
                            <h4 className="text-3xl md:text-4xl font-[900] tracking-tight" style={headingFontStyle}>{headingFont.name || 'Not Set'}</h4>
                            <p className="text-sm opacity-40 mt-1">Display & Headings</p>
                        </div>

                        <div className="space-y-8" style={headingFontStyle}>
                            <div className="text-8xl md:text-9xl font-[900] tracking-tighter leading-none">
                                Aa
                            </div>

                            <div className="space-y-4">
                                <p className="text-4xl md:text-5xl font-[900] tracking-tight leading-tight break-all">
                                    {alphabet}
                                </p>
                                <p className="text-4xl md:text-5xl font-[900] tracking-tight leading-tight break-all">
                                    {lowercase}
                                </p>
                                <p className="text-4xl md:text-5xl font-[900] tracking-tight leading-tight">
                                    {numbers}
                                </p>
                            </div>

                            <p className="text-2xl md:text-3xl font-[900] tracking-tight leading-tight max-w-4xl">
                                The quick brown fox jumps over the lazy dog
                            </p>

                            <p className="text-lg opacity-30 font-mono break-all">
                                {special}
                            </p>
                        </div>

                        {showWeights && headingFont.weights && headingFont.weights.length > 1 && (
                            <div className="mt-12 pt-12 border-t border-current/10">
                                <h5 className="text-xs uppercase tracking-widest font-bold opacity-40 mb-6">Weight Variations</h5>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {headingFont.weights.map((weight) => (
                                        <div key={weight} className="text-center">
                                            <div className="text-5xl mb-2" style={{ ...headingFontStyle, fontWeight: weight }}>
                                                Aa
                                            </div>
                                            <p className="text-xs opacity-40">{weight}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Body Font */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="bg-white rounded-3xl p-12 md:p-16 shadow-sm border border-black/5"
                    >
                        <div className="mb-8">
                            <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40 mb-2">Body Font</h3>
                            <h4 className="text-3xl md:text-4xl font-medium" style={bodyFontStyle}>{bodyFont.name || 'Not Set'}</h4>
                            <p className="text-sm opacity-40 mt-1">Paragraphs & UI Text</p>
                        </div>

                        <div className="space-y-8" style={bodyFontStyle}>
                            <div className="text-8xl md:text-9xl font-medium leading-none">
                                Aa
                            </div>

                            <div className="space-y-4">
                                <p className="text-3xl md:text-4xl font-medium leading-tight break-all">
                                    {alphabet}
                                </p>
                                <p className="text-3xl md:text-4xl font-medium leading-tight break-all">
                                    {lowercase}
                                </p>
                                <p className="text-3xl md:text-4xl font-medium leading-tight">
                                    {numbers}
                                </p>
                            </div>

                            <p className="text-lg md:text-xl leading-relaxed max-w-4xl opacity-80">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                            </p>

                            <p className="text-sm opacity-30 font-mono break-all">
                                {special}
                            </p>
                        </div>

                        {showWeights && bodyFont.weights && bodyFont.weights.length > 1 && (
                            <div className="mt-12 pt-12 border-t border-current/10">
                                <h5 className="text-xs uppercase tracking-widest font-bold opacity-40 mb-6">Weight Variations</h5>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {bodyFont.weights.map((weight) => (
                                        <div key={weight} className="text-center">
                                            <div className="text-5xl mb-2" style={{ ...bodyFontStyle, fontWeight: weight }}>
                                                Aa
                                            </div>
                                            <p className="text-xs opacity-40">{weight}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

