"use client";

import { BrandPage } from "@/lib/brandPageTypes";
import { motion } from "framer-motion";

interface TechModernProps {
    brandPage: BrandPage;
}

export default function TechModern({ brandPage }: TechModernProps) {
    const {
        brandName,
        tagline,
        story,
        logos,
        fonts,
        colors,
        mockups,
        textOverrides
    } = brandPage;

    const accentGradient = "from-purple-500 via-pink-500 to-orange-400";

    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] text-white">

            {/* HERO - Dark with gradient accent */}
            <section className="min-h-screen flex flex-col justify-center items-center px-8 relative overflow-hidden">
                {/* Background gradient orb */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-400/20 rounded-full blur-3xl" />

                {/* Top nav style */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute top-8 left-8 right-8 flex justify-between items-center"
                >
                    <span className="text-xs font-mono text-white/40">
                        {brandPage.heroConfig?.categoryLabel || "Brand System"}
                    </span>
                    <span className="text-xs font-mono text-white/40">
                        {brandPage.heroConfig?.year || new Date().getFullYear()}
                    </span>
                </motion.div>

                {/* Center Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10"
                >
                    {logos.light ? (
                        <img
                            src={logos.light}
                            alt={brandName}
                            className="max-w-[350px] max-h-[180px] object-contain"
                        />
                    ) : (
                        <h1 className="text-6xl md:text-8xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            {brandName}
                        </h1>
                    )}
                </motion.div>

                {/* Tagline with gradient */}
                {tagline && (
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className={`mt-8 text-lg bg-gradient-to-r ${accentGradient} bg-clip-text text-transparent font-medium`}
                    >
                        {tagline}
                    </motion.p>
                )}

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                >
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-6 h-10 border border-white/20 rounded-full flex justify-center pt-2"
                    >
                        <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                    </motion.div>
                </motion.div>
            </section>

            {/* STORY - Glassmorphism card */}
            {story && (
                <section className="w-full py-32 px-8">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            {/* Glass card */}
                            <div className="p-8 md:p-12 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10">
                                <p className={`text-xs font-mono uppercase tracking-widest bg-gradient-to-r ${accentGradient} bg-clip-text text-transparent mb-6`}>
                                    About
                                </p>
                                <p className="text-xl md:text-2xl font-light leading-relaxed text-white/80">
                                    {story}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </section>
            )}

            {/* LOGOS - Dark cards with glow */}
            <section className="w-full py-32 px-8">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="mb-16 flex items-end gap-4"
                    >
                        <span className={`text-6xl font-bold bg-gradient-to-r ${accentGradient} bg-clip-text text-transparent`}>01</span>
                        <h2 className="text-3xl md:text-4xl font-light text-white/90 pb-2">
                            {textOverrides?.logoShowcaseTitle || "Logo System"}
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Light logo on dark */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center p-12 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/10 to-orange-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            {logos.light ? (
                                <img src={logos.light} alt="Primary" className="max-w-[200px] max-h-[100px] object-contain relative z-10" />
                            ) : (
                                <span className="text-3xl font-light relative z-10">{brandName}</span>
                            )}
                            <span className="absolute bottom-4 left-4 text-[10px] font-mono text-white/30">Primary / Dark BG</span>
                        </motion.div>

                        {/* Dark logo on light */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="aspect-[4/3] rounded-2xl bg-white flex items-center justify-center p-12 relative overflow-hidden"
                        >
                            {logos.dark ? (
                                <img src={logos.dark} alt="Inverted" className="max-w-[200px] max-h-[100px] object-contain" />
                            ) : (
                                <span className="text-3xl font-light text-black">{brandName}</span>
                            )}
                            <span className="absolute bottom-4 left-4 text-[10px] font-mono text-black/30">Primary / Light BG</span>
                        </motion.div>

                        {/* Icon variations */}
                        {(logos.iconLight || logos.iconDark) && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                    className="aspect-square rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center p-8"
                                >
                                    {logos.iconLight && <img src={logos.iconLight} alt="Icon" className="max-w-[80px] max-h-[80px] object-contain" />}
                                    <span className="absolute bottom-4 left-4 text-[10px] font-mono text-white/30">Icon</span>
                                </motion.div>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* COLORS - Floating cards */}
            <section className="w-full py-32 px-8">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="mb-16 flex items-end gap-4"
                    >
                        <span className={`text-6xl font-bold bg-gradient-to-r ${accentGradient} bg-clip-text text-transparent`}>02</span>
                        <h2 className="text-3xl md:text-4xl font-light text-white/90 pb-2">
                            {textOverrides?.colorTitle || "Color System"}
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(colors.colors || []).map((color, index) => (
                            <motion.div
                                key={color.hex}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="group"
                            >
                                <div
                                    className="aspect-square rounded-2xl mb-4 relative overflow-hidden shadow-2xl transition-transform duration-300 group-hover:scale-105"
                                    style={{ backgroundColor: color.hex }}
                                >
                                    {/* Glow effect */}
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-xl"
                                        style={{ backgroundColor: color.hex }}
                                    />
                                </div>
                                <p className="text-sm font-medium">{color.name}</p>
                                <p className="text-xs font-mono text-white/40 mt-1">{color.hex}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TYPOGRAPHY */}
            <section className="w-full py-32 px-8">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="mb-16 flex items-end gap-4"
                    >
                        <span className={`text-6xl font-bold bg-gradient-to-r ${accentGradient} bg-clip-text text-transparent`}>03</span>
                        <h2 className="text-3xl md:text-4xl font-light text-white/90 pb-2">
                            {textOverrides?.typographyTitle || "Typography"}
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Heading */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="p-8 rounded-2xl bg-white/5 border border-white/10"
                        >
                            <p className="text-xs font-mono text-white/40 mb-4">HEADING</p>
                            <p className="text-6xl font-bold mb-4">Aa</p>
                            <p className="text-lg text-white/60">{fonts.heading?.name || "Inter"}</p>
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <p className="text-2xl font-bold tracking-tight">The quick brown fox</p>
                            </div>
                        </motion.div>

                        {/* Body */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="p-8 rounded-2xl bg-white/5 border border-white/10"
                        >
                            <p className="text-xs font-mono text-white/40 mb-4">BODY</p>
                            <p className="text-5xl font-normal mb-4">Aa</p>
                            <p className="text-lg text-white/60">{fonts.body?.name || "Inter"}</p>
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <p className="text-base leading-relaxed text-white/70">The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* MOCKUPS */}
            {mockups.length > 0 && (
                <section className="w-full py-32 px-8">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="mb-16 flex items-end gap-4"
                        >
                            <span className={`text-6xl font-bold bg-gradient-to-r ${accentGradient} bg-clip-text text-transparent`}>04</span>
                            <h2 className="text-3xl md:text-4xl font-light text-white/90 pb-2">
                                {textOverrides?.mockupsTitle || "Applications"}
                            </h2>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {mockups.map((mockup, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="aspect-[4/3] rounded-2xl overflow-hidden bg-white/5 border border-white/10"
                                >
                                    <img
                                        src={mockup.url}
                                        alt={mockup.categoryLabel}
                                        className="w-full h-full object-cover"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* FOOTER */}
            <section className="w-full py-32 px-8 border-t border-white/10">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className={`text-5xl md:text-6xl font-bold bg-gradient-to-r ${accentGradient} bg-clip-text text-transparent mb-8`}>
                            {textOverrides?.footerTitle || "Let's Build"}
                        </h2>
                        <p className="text-white/40 text-lg mb-6">
                            {textOverrides?.footerSubtitle || "Ready to collaborate?"}
                        </p>
                        <a
                            href={`mailto:${textOverrides?.footerEmail || 'hello@example.com'}`}
                            className="inline-block px-8 py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors"
                        >
                            {textOverrides?.footerEmail || 'Get in touch'}
                        </a>
                    </motion.div>

                    <div className="mt-24 pt-8 border-t border-white/10 flex justify-between text-xs font-mono text-white/30">
                        <span>© {new Date().getFullYear()} {brandName}</span>
                        <span>Brand Guidelines v1.0</span>
                    </div>
                </div>
            </section>
        </div>
    );
}
